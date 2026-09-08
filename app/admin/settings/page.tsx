"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    phone: "",
    whatsapp: "",
    store_name: "CANDELA",
    tagline: "Your Feminine Scent",
    about: "",
    instagram: "",
    currency: "EGP",
    delivery_note: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Admin Account Credentials State
  const [adminProfile, setAdminProfile] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminSaved, setAdminSaved] = useState(false);
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setSettings((prev) => ({ ...prev, ...data })));

    fetch("/api/admin/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.email) {
          setAdminProfile({
            name: data.name || "",
            email: data.email || "",
            password: "",
          });
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        const refreshed = await fetch("/api/settings").then((r) => r.json());
        setSettings((prev) => ({ ...prev, ...refreshed }));
        setTimeout(() => setSaved(false), 2500);
      } else {
        alert("Failed to save settings. Please try again.");
      }
    } catch {
      alert("Failed to connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSaving(true);
    setAdminError("");
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminProfile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update admin account");
      setAdminSaved(true);
      setAdminProfile((prev) => ({
        ...prev,
        name: data.user?.name || prev.name,
        email: data.user?.email || prev.email,
        password: "",
      }));
      setTimeout(() => setAdminSaved(false), 3000);
    } catch (err: any) {
      setAdminError(err.message);
    } finally {
      setAdminSaving(false);
    }
  };

  const update = (field: keyof typeof settings) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setSettings((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10">
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", fontWeight: 300, color: "white", letterSpacing: "0.1em", marginBottom: "8px" }}>
        Settings
      </h1>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", fontFamily: "'Jost', sans-serif", marginBottom: "32px" }}>
        Configure your store settings &amp; owner administrator account
      </p>

      <div className="max-w-xl space-y-8">
        {/* Admin Owner Account Section */}
        <div className="rounded-2xl p-6 space-y-4 border border-purple-500/20 bg-purple-950/10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">👑</span>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "white", fontWeight: 400 }}>
              Owner Admin Account
            </h2>
          </div>
          <p className="text-xs text-white/50 font-body leading-relaxed mb-4">
            These credentials are exclusively for logging into the Admin Panel. Regular website customers cannot access the admin panel.
          </p>

          {adminError && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-xs text-red-200">
              {adminError}
            </div>
          )}

          <form onSubmit={handleSaveAdmin} className="space-y-4">
            <div>
              <label className="settings-label">Admin Name / Username</label>
              <input
                type="text"
                value={adminProfile.name}
                onChange={(e) => setAdminProfile((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Candela Owner"
                className="settings-input"
                required
              />
            </div>

            <div>
              <label className="settings-label">Admin Login Email</label>
              <input
                type="email"
                value={adminProfile.email}
                onChange={(e) => setAdminProfile((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="admin@candela.store"
                className="settings-input"
                required
              />
            </div>

            <div>
              <label className="settings-label">New Password (leave blank to keep current)</label>
              <input
                type="password"
                value={adminProfile.password}
                onChange={(e) => setAdminProfile((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                className="settings-input"
              />
            </div>

            <button
              type="submit"
              disabled={adminSaving}
              className="w-full py-3 text-xs font-bold font-body tracking-widest uppercase rounded-xl transition-all cursor-pointer border"
              style={{
                background: adminSaved ? "#86EFAC" : "rgba(244,167,185,0.15)",
                color: adminSaved ? "#1A1A1A" : "#F4A7B9",
                borderColor: adminSaved ? "#86EFAC" : "rgba(244,167,185,0.3)",
              }}
            >
              {adminSaving ? "Updating..." : adminSaved ? "✓ Admin Account Updated" : "Save Admin Credentials"}
            </button>
          </form>
        </div>
        {/* Store Info */}
        <Section title="Store Information">
          <SettingInput label="Store Name" value={settings.store_name} onChange={update("store_name")} />
          <SettingInput label="Tagline" value={settings.tagline} onChange={update("tagline")} />
          <div>
            <label className="settings-label">About</label>
            <textarea
              value={settings.about}
              onChange={update("about")}
              rows={4}
              className="settings-input resize-none"
              placeholder="Describe your brand..."
            />
          </div>
        </Section>

        {/* Contact */}
        <Section title="Contact & Social">
          <SettingInput label="Phone Number" value={settings.phone} onChange={update("phone")} placeholder="+20 100 000 0000" />
          <SettingInput label="WhatsApp" value={settings.whatsapp} onChange={update("whatsapp")} placeholder="+20 100 000 0000" />
          <SettingInput label="Instagram" value={settings.instagram} onChange={update("instagram")} placeholder="@candela.official" />
        </Section>

        {/* Store Behavior */}
        <Section title="Store Behavior">
          <SettingInput label="Currency" value={settings.currency} onChange={update("currency")} placeholder="EGP" />
          <div>
            <label className="settings-label">Delivery Note (shown to customers after ordering)</label>
            <textarea
              value={settings.delivery_note}
              onChange={update("delivery_note")}
              rows={3}
              className="settings-input resize-none"
              placeholder="e.g. We will contact you within 24 hours..."
            />
          </div>
        </Section>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 font-medium text-sm tracking-widest uppercase"
          style={{
            background: saved ? "#86EFAC" : "#F4A7B9",
            color: "#1A1A1A",
            borderRadius: "12px",
            fontFamily: "'Jost', sans-serif",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving..." : saved ? "✓ Saved" : "Save Settings"}
        </motion.button>
      </div>

      <style jsx global>{`
        .settings-label {
          display: block;
          font-family: 'Jost', sans-serif;
          font-size: 0.65rem;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .settings-input {
          width: 100%;
          padding: 10px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.8);
          border-radius: 10px;
          font-family: 'Jost', sans-serif;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .settings-input:focus { border-color: rgba(244,167,185,0.4); }
        .settings-input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", color: "white", marginBottom: "16px" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function SettingInput({ label, value, onChange, placeholder }: {
  label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="settings-label">{label}</label>
      <input type="text" value={value} onChange={onChange} placeholder={placeholder} className="settings-input" />
    </div>
  );
}
