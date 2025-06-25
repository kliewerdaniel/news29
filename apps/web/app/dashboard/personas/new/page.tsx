"use client";
import { useState } from "react";

export default function NewPersonaPage() {
  const [form, setForm] = useState({
    name: "",
    tone: "",
    promptStyle: "",
    description: ""
  });
  const [preview, setPreview] = useState("");

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const previewLLM = async () => {
    const res = await fetch("/api/persona/preview", {
      method: "POST",
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    setPreview(data.preview);
  };

  const submit = async () => {
    await fetch("/api/persona/create", {
      method: "POST",
      body: JSON.stringify({ 
        ...form,
        id: form.name.toLowerCase().replace(/\s+/g, "-")
      }),
      headers: { "Content-Type": "application/json" },
    });
    alert("Persona created!");
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">🧑‍🎤 Create New Persona</h2>
      
      <div className="space-y-4">
        {["name", "tone", "promptStyle", "description"].map((field) => (
          <div key={field} className="space-y-2">
            <label className="text-sm font-medium text-gray-700 capitalize">
              {field}
            </label>
            <input
              type={field === "description" ? "textarea" : "text"}
              placeholder={`Enter ${field}...`}
              value={form[field as keyof typeof form]}
              onChange={(e) => update(field, e.target.value)}
              className="border p-2 w-full rounded"
            />
          </div>
        ))}
      </div>

      <div className="space-x-4">
        <button 
          onClick={previewLLM} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition"
        >
          Preview Response
        </button>
        
        <button 
          onClick={submit}
          disabled={!form.name || !form.description}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Persona
        </button>
      </div>

      {preview && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">Preview:</h3>
          <blockquote className="p-4 italic bg-gray-100 rounded">
            {preview}
          </blockquote>
        </div>
      )}
    </div>
  );
}
