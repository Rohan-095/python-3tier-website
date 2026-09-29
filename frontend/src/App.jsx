import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "";
const NOTES = `${API_URL}/api/notes/`;

async function request(url, options) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.status === 204 ? null : res.json();
}

export default function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () =>
    request(NOTES)
      .then((data) => { setNotes(data); setError(""); })
      .catch(() => setError("Can't reach the notes service. Check that the backend is running."))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const reset = () => { setTitle(""); setContent(""); setEditingId(null); };

  const save = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const body = JSON.stringify({ title: title.trim(), content });
    try {
      if (editingId) await request(`${NOTES}${editingId}/`, { method: "PUT", body });
      else await request(NOTES, { method: "POST", body });
      reset();
      await load();
    } catch {
      setError("Couldn't save the note. Try again.");
    }
  };

  const remove = async (id) => {
    try {
      await request(`${NOTES}${id}/`, { method: "DELETE" });
      if (id === editingId) reset();
      await load();
    } catch {
      setError("Couldn't delete the note. Try again.");
    }
  };

  const edit = (n) => { setEditingId(n.id); setTitle(n.title); setContent(n.content); };

  return (
    <main className="page">
      <h1>Notes</h1>

      <form className="editor" onSubmit={save}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          maxLength={200}
          aria-label="Title"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write something down"
          rows={4}
          aria-label="Content"
        />
        <div className="actions">
          <button type="submit" className="primary">{editingId ? "Save changes" : "Add note"}</button>
          {editingId && <button type="button" onClick={reset}>Cancel</button>}
        </div>
      </form>

      {error && <p className="error" role="alert">{error}</p>}
      {loading && <p className="muted">Loading notes…</p>}
      {!loading && !error && notes.length === 0 && (
        <p className="muted">No notes yet. Add your first one above.</p>
      )}

      <ul className="list">
        {notes.map((n) => (
          <li key={n.id}>
            <h2>{n.title}</h2>
            {n.content && <p>{n.content}</p>}
            <div className="meta">
              <time>{new Date(n.created_at).toLocaleString()}</time>
              <span>
                <button onClick={() => edit(n)}>Edit</button>
                <button className="danger" onClick={() => remove(n.id)}>Delete</button>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
