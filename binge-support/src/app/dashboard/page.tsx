"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [content, setContent] = useState("");
  const [publish, setPublish] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [username, setUsername] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadEntries();
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.replace("/");
    const { data } = await supabase.from("profiles").select("username").eq("id", user.id).single();
    if (data) setUsername(data.username);
  }

  async function loadEntries() {
    const { data } = await supabase.from("entries").select("*").order("created_at", { ascending: false });
    if (data) setEntries(data);
  }

  async function saveEntry() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("entries").insert({
      user_id: user.id,
      content,
      is_public: publish,
    });
    setContent("");
    setPublish(false);
    loadEntries();
  }

  return (
    <main>
      <h2>MY JOURNAL</h2>
      <p>USER: {username}</p>

      <section>
        <h3>SECTION A: DISPLAY NAME</h3>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter display name"
        />
        <button onClick={async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase.from("profiles").update({ username }).eq("id", user.id);
        }}>SAVE</button>
      </section>

      <section>
        <h3>SECTION B: NEW ENTRY</h3>
        <textarea
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write about your feelings / triggers..."
        />
        <label>
          <input
            type="checkbox"
            checked={publish}
            onChange={(e) => setPublish(e.target.checked)}
          /> Publish this note
        </label>
        <button onClick={saveEntry}>SAVE</button>
      </section>

      <section>
        <h3>Recent</h3>
        {entries.map((e, i) => (
          <div key={i} className="entry-box">
            <p>ENTRY NO. {i + 1} / {new Date(e.created_at).toLocaleString()}</p>
            <p>{e.content}</p>
            <p>{e.is_public ? "[ PUBLISHED ]" : "[ PRIVATE ]"}</p>
          </div>
        ))}
      </section>
    </main>
  );
}