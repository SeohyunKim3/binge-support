'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

type FeedItem = {
  id: string
  user_id: string
  content: string
  created_at: string
  is_public: boolean
  profiles?: { 
    username?: string | null 
} | null
}

export default function SocialPage() {
  const router = useRouter()
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  // 🔑 Function to load published entries
  async function load() {
    const { data, error } = await supabase
      .from("entries")
      .select(`
        id,
        user_id,
        content,
        created_at,
        is_public,
        profiles (
          username
        )
      `)
      .eq("is_public", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
    } else {
      setItems(data as FeedItem[])
    }
    setLoading(false)
  }

  // Require login & then load feed
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/')
        return
      }
      load()
    })
  }, [])

  if (loading) return <p>Loading feed...</p>

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h2>Community Feed</h2>
      {items.length === 0 && <p>No published notes yet.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map((item) => (
          <li key={item.id} style={{ borderBottom: '1px solid #ddd', padding: '12px 0' }}>
            <p><strong>{item.profiles?.username ?? "Anonymous"}</strong></p>
            <p>{item.content}</p>
            <small>{new Date(item.created_at).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </main>
  )
}