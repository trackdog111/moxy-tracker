'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uvecrllugptstymxnxrj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2ZWNybGx1Z3B0c3R5bXhueHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjcxMjQsImV4cCI6MjA4NTgwMzEyNH0.SgNTXQoo9JJZwfcjK6GcXrDqphzpG-6XEiua_wRpb0Q'
const supabase = createClient(supabaseUrl, supabaseKey)

const THEMES = {
  dark: {
    primary: '#4A9AB5', dark: '#2D6E7E', bg: '#1a1f2e', card: '#232838',
    cardBorder: '#2e3446', text: '#f1f5f9', textMuted: '#94a3b8',
    red: '#ef4444', blue: '#4A9AB5', yellow: '#EAB308', green: '#22C55E',
    inputBg: '#1a1f2e', colorScheme: 'dark',
  },
  light: {
    primary: '#4A9AB5', dark: '#2D6E7E', bg: '#f0f4f8', card: '#ffffff',
    cardBorder: '#d1d9e6', text: '#1e293b', textMuted: '#64748b',
    red: '#dc2626', blue: '#4A9AB5', yellow: '#ca8a04', green: '#16a34a',
    inputBg: '#ffffff', colorScheme: 'light',
  },
}

const INVITE_CODES = {
  'CS-8X4M': 'City Scaffold',
  'CMP-7K2N': 'CMP Construction',
  'DOM-3P9W': 'Dominion Constructors',
  'NAU-5R6J': 'Nauhria',
}

const COMPANIES = [...new Set(Object.values(INVITE_CODES))]

const isAdmin = (user) => user && user.name.toLowerCase() === 'shane' && user.company === 'City Scaffold'

const TRADE_PERMISSIONS = {
  'City Scaffold': ['shore'],
  'CMP Construction': ['pour'],
  'Dominion Constructors': ['pour'],
  'Nauhria': ['steel'],
}

const COMPANY_COLORS = {
  'City Scaffold': '#4A9AB5',
  'CMP Construction': '#F97316',
  'Dominion Constructors': '#8B5CF6',
  'Nauhria': '#22C55E',
}

function canEdit(user, field) {
  if (isAdmin(user)) return true
  const allowed = TRADE_PERMISSIONS[user.company] || []
  return allowed.includes(field)
}

function getLevelLabel(num) {
  if (num === 1) return 'B1.5'
  if (num === 2) return 'Ground'
  if (num === 3) return 'Ground (upper)'
  if (num === 4) return 'G-L2 (lower)'
  if (num === 5) return 'G-L2 (upper)'
  if (num === 44) return 'Roof'
  const offset = num - 6
  const group = Math.floor(offset / 3)
  const pos = offset % 3
  const level = group + 2
  if (pos === 0 || pos === 1) return `Level ${level}`
  return `Level ${level}.5`
}

function getStatusColor(item, B) {
  if (item.pour_complete) return B.green
  if (item.steel_complete) return B.yellow
  if (item.shore_complete) return B.blue
  return B.red
}

function getStatusText(item) {
  if (item.pour_complete) return 'Poured'
  if (item.steel_complete) return 'Steel Done'
  if (item.shore_complete) return 'Shored'
  return 'Not Started'
}

function toLocalInput(isoStr) {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch { return '' }
}

function formatNZDate(isoStr) {
  if (!isoStr) return '-'
  try { return new Date(isoStr).toLocaleString('en-NZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return '-' }
}

// ─── PRINT STYLES ───────────────────────────────────────────────
function getPrintStyles(theme) {
  return `
    @media print {
      @page { size: landscape; margin: 10mm; }
      body { background: #fff !important; color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .print-only { display: block !important; }
      .print-table { width: 100%; border-collapse: collapse; font-size: 10px; }
      .print-table th, .print-table td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
      .print-table th { background: #e2e8f0; font-weight: 700; }
      .print-status { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 4px; }
    }
  `
}

// ─── LOGIN ──────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const B = THEMES.dark

  const inputStyle = { width: '100%', padding: '10px 12px', background: B.bg, border: `1px solid ${B.cardBorder}`, borderRadius: 8, color: B.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }

  const handleLogin = async () => {
    if (!name.trim() || !password.trim()) { setError('Enter name and password'); return }
    setLoading(true); setError('')
    const { data, error: err } = await supabase.from('users').select('*').eq('name_lower', name.trim().toLowerCase()).single()
    if (err || !data) { setError('User not found. Register first.'); setLoading(false); return }
    if (data.password !== password) { setError('Wrong password'); setLoading(false); return }
    onLogin({ name: data.name, company: data.company, role: data.role, id: data.id })
    setLoading(false)
  }

  const handleRegister = async () => {
    if (!name.trim() || !password.trim() || !inviteCode.trim()) { setError('Fill in all fields'); return }
    if (password.trim().length < 4) { setError('Password must be at least 4 characters'); return }
    const company = INVITE_CODES[inviteCode.trim().toUpperCase()]
    if (!company) { setError('Invalid invite code. Check the code your supervisor sent you.'); return }
    setLoading(true); setError('')
    const nameLower = name.trim().toLowerCase()
    const { data: existing } = await supabase.from('users').select('id').eq('name_lower', nameLower).single()
    if (existing) { setError('Name already taken. Log in instead.'); setLoading(false); return }
    const { data, error: err } = await supabase.from('users').insert({ name: name.trim(), name_lower: nameLower, company, password: password.trim(), role: 'user' }).select().single()
    if (err) { setError('Registration failed: ' + err.message); setLoading(false); return }
    onLogin({ name: data.name, company: data.company, role: data.role, id: data.id })
    setLoading(false)
  }

  const handleKey = (e) => { if (e.key === 'Enter') { mode === 'login' ? handleLogin() : handleRegister() } }

  return (
    <div style={{ minHeight: '100vh', background: B.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: B.card, border: `1px solid ${B.cardBorder}`, borderRadius: 12, padding: 40, width: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, background: B.primary, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff' }}>CS</div>
          <span style={{ color: B.text, fontWeight: 700, fontSize: 18 }}>Moxy Hotel</span>
        </div>
        <p style={{ color: B.textMuted, fontSize: 13, marginBottom: 20 }}>Stair Landing & Lobby Slab Tracker</p>
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderRadius: 8, overflow: 'hidden', border: `1px solid ${B.cardBorder}` }}>
          <button onClick={() => { setMode('login'); setError('') }} style={{ flex: 1, padding: '8px', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: mode === 'login' ? B.primary : B.bg, color: mode === 'login' ? '#fff' : B.textMuted }}>Log In</button>
          <button onClick={() => { setMode('register'); setError('') }} style={{ flex: 1, padding: '8px', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: mode === 'register' ? B.primary : B.bg, color: mode === 'register' ? '#fff' : B.textMuted }}>Register</button>
        </div>
        <label style={{ color: B.textMuted, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>YOUR NAME</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Shane" style={{ ...inputStyle, marginBottom: 16 }} onKeyDown={handleKey} />
        <label style={{ color: B.textMuted, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>PASSWORD</label>
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder={mode === 'register' ? 'Create a password (min 4 chars)' : 'Enter your password'} style={{ ...inputStyle, marginBottom: 16 }} onKeyDown={handleKey} />
        {mode === 'register' && (
          <>
            <label style={{ color: B.textMuted, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>INVITE CODE</label>
            <input value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="Enter code from your supervisor" style={{ ...inputStyle, marginBottom: 16 }} onKeyDown={handleKey} />
          </>
        )}
        {error && <p style={{ color: B.red, fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button onClick={mode === 'login' ? handleLogin : handleRegister} disabled={loading} style={{ width: '100%', padding: '12px', background: B.primary, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Register'}
        </button>
      </div>
    </div>
  )
}

// ─── HEADER ─────────────────────────────────────────────────────
function Header({ user, landings, lobbySlabs, activeTab, setActiveTab, onLogout, theme, setTheme, tracker, setTracker }) {
  const B = THEMES[theme]
  const items = tracker === 'landings' ? landings : lobbySlabs
  const shored = items.filter(l => l.shore_complete && !l.steel_complete && !l.pour_complete).length
  const steel = items.filter(l => l.steel_complete && !l.pour_complete).length
  const poured = items.filter(l => l.pour_complete).length
  const notStarted = items.length - shored - steel - poured
  const tabs = tracker === 'landings'
    ? (isAdmin(user) ? ['Diagram', 'Table', 'Activity', 'Chat'] : ['Diagram', 'Table', 'Chat'])
    : (isAdmin(user) ? ['Table', 'Activity', 'Chat'] : ['Table', 'Chat'])

  return (
    <div className="no-print" style={{ background: B.card, borderBottom: `1px solid ${B.cardBorder}`, padding: '0 16px', display: 'flex', alignItems: 'center', minHeight: 56, gap: 12, position: 'sticky', top: 0, zIndex: 100, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, background: B.primary, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, color: '#fff' }}>CS</div>
        <div>
          <div style={{ color: B.text, fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Moxy Hotel</div>
          <div style={{ color: B.textMuted, fontSize: 11 }}>{user.name} ({user.company}){isAdmin(user) ? ' — Admin' : ''}</div>
        </div>
      </div>

      {/* Tracker toggle */}
      <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: `1px solid ${B.cardBorder}` }}>
        <button onClick={() => { setTracker('landings'); setActiveTab('Diagram') }} style={{ padding: '5px 12px', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: tracker === 'landings' ? B.primary : B.bg, color: tracker === 'landings' ? '#fff' : B.textMuted }}>Stair Landings</button>
        <button onClick={() => { setTracker('lobby'); setActiveTab('Table') }} style={{ padding: '5px 12px', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: tracker === 'lobby' ? B.primary : B.bg, color: tracker === 'lobby' ? '#fff' : B.textMuted }}>Lobby Slabs</button>
      </div>

      {/* Status counts */}
      <div style={{ display: 'flex', gap: 12 }}>
        <span style={{ color: B.red, fontWeight: 700, fontSize: 13 }}>{notStarted} <span style={{ color: B.textMuted, fontWeight: 400, fontSize: 10 }}>Not Started</span></span>
        <span style={{ color: B.blue, fontWeight: 700, fontSize: 13 }}>{shored} <span style={{ color: B.textMuted, fontWeight: 400, fontSize: 10 }}>Shored</span></span>
        <span style={{ color: B.yellow, fontWeight: 700, fontSize: 13 }}>{steel} <span style={{ color: B.textMuted, fontWeight: 400, fontSize: 10 }}>Steel</span></span>
        <span style={{ color: B.green, fontWeight: 700, fontSize: 13 }}>{poured} <span style={{ color: B.textMuted, fontWeight: 400, fontSize: 10 }}>Poured</span></span>
      </div>
      <div style={{ flex: 1 }} />

      {/* Tab buttons */}
      <div style={{ display: 'flex', gap: 4 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: activeTab === t ? B.primary : 'transparent', color: activeTab === t ? '#fff' : B.textMuted }}>{t}</button>
        ))}
      </div>

      {/* Theme toggle */}
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ padding: '5px 10px', background: B.bg, border: `1px solid ${B.cardBorder}`, borderRadius: 6, fontSize: 14, cursor: 'pointer', color: B.text }} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <button onClick={onLogout} style={{ padding: '5px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Logout</button>
    </div>
  )
}

// ─── DIAGRAM VIEW ───────────────────────────────────────────────
function DiagramView({ landings, setLandings, user, drawingUrl, setDrawingUrl, theme }) {
  const B = THEMES[theme]
  const containerRef = useRef(null)
  const [dragging, setDragging] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(70)
  const fileInputRef = useRef(null)
  const admin = isAdmin(user)

  const handleUpload = async (e) => {
    if (!admin) return
    const file = e.target.files[0]
    if (!file) return
    // Upload to Supabase storage
    const fileName = `stairwell_drawing.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('drawings').upload(fileName, file, { upsert: true })
    if (error) { alert('Upload failed: ' + error.message); return }
    const { data: urlData } = supabase.storage.from('drawings').getPublicUrl(fileName)
    if (urlData?.publicUrl) {
      const urlWithCache = urlData.publicUrl + '?t=' + Date.now()
      setDrawingUrl(urlWithCache)
      // Save the URL in settings table so all devices load it
      await supabase.from('settings').upsert({ key: 'drawing_url', value: urlWithCache }, { onConflict: 'key' })
    }
  }

  useEffect(() => {
    // Load drawing URL from settings (shared across all devices)
    const loadDrawing = async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'drawing_url').single()
      if (data?.value) setDrawingUrl(data.value)
    }
    loadDrawing()
  }, [])

  const handleMouseDown = (e, id) => {
    if (!admin) return
    e.preventDefault(); e.stopPropagation()
    const landing = landings.find(l => l.id === id)
    if (!landing || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const mxp = ((e.clientX - rect.left) / rect.width) * 100
    const myp = ((e.clientY - rect.top) / rect.height) * 100
    setDragging(id)
    setDragOffset({ x: mxp - (landing.pos_x || 50), y: myp - (landing.pos_y || 50) })
  }

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const nx = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.x))
    const ny = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.y))
    setLandings(prev => prev.map(l => l.id === dragging ? { ...l, pos_x: nx, pos_y: ny } : l))
  }, [dragging, dragOffset])

  const handleMouseUp = useCallback(async () => {
    if (!dragging) return
    const landing = landings.find(l => l.id === dragging)
    if (landing) await supabase.from('landings').update({ pos_x: landing.pos_x, pos_y: landing.pos_y }).eq('id', landing.id)
    setDragging(null)
  }, [dragging, landings])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp) }
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  const handleTouchStart = (e, id) => {
    if (!admin) return
    e.preventDefault()
    const touch = e.touches[0]
    const landing = landings.find(l => l.id === id)
    if (!landing || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const mxp = ((touch.clientX - rect.left) / rect.width) * 100
    const myp = ((touch.clientY - rect.top) / rect.height) * 100
    setDragging(id)
    setDragOffset({ x: mxp - (landing.pos_x || 50), y: myp - (landing.pos_y || 50) })
  }

  useEffect(() => {
    if (!dragging) return
    const onTouchMove = (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const nx = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100 - dragOffset.x))
      const ny = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100 - dragOffset.y))
      setLandings(prev => prev.map(l => l.id === dragging ? { ...l, pos_x: nx, pos_y: ny } : l))
    }
    const onTouchEnd = async () => {
      const landing = landings.find(l => l.id === dragging)
      if (landing) await supabase.from('landings').update({ pos_x: landing.pos_x, pos_y: landing.pos_y }).eq('id', landing.id)
      setDragging(null)
    }
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    return () => { window.removeEventListener('touchmove', onTouchMove); window.removeEventListener('touchend', onTouchEnd) }
  }, [dragging, dragOffset, landings])

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="no-print" style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 10, background: B.card, borderBottom: `1px solid ${B.cardBorder}` }}>
        {admin && (
          <>
            <input type="file" ref={fileInputRef} accept="image/*,.pdf" onChange={handleUpload} style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} style={{ padding: '6px 14px', background: B.bg, border: `1px solid ${B.cardBorder}`, borderRadius: 6, color: B.text, fontSize: 12, cursor: 'pointer' }}>Upload Drawing</button>
          </>
        )}
        <button onClick={() => setZoom(z => Math.max(20, z - 10))} style={{ padding: '6px 10px', background: B.bg, border: `1px solid ${B.cardBorder}`, borderRadius: 6, color: B.text, fontSize: 14, cursor: 'pointer' }}>−</button>
        <span style={{ color: B.textMuted, fontSize: 12, minWidth: 40, textAlign: 'center' }}>{zoom}%</span>
        <button onClick={() => setZoom(z => Math.min(200, z + 10))} style={{ padding: '6px 10px', background: B.bg, border: `1px solid ${B.cardBorder}`, borderRadius: 6, color: B.text, fontSize: 14, cursor: 'pointer' }}>+</button>
        <span style={{ color: B.textMuted, fontSize: 11, marginLeft: 10 }}>{admin ? 'Admin mode — drag circles to reposition.' : 'View only — landing positions set by admin.'}</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', background: theme === 'dark' ? '#111' : '#e2e8f0' }}>
        <div ref={containerRef} style={{ position: 'relative', width: `${zoom}%`, minHeight: 400, margin: '0 auto', userSelect: 'none' }}>
          {drawingUrl ? (
            <img src={drawingUrl} alt="Stair landings" style={{ width: '100%', display: 'block', pointerEvents: 'none' }} draggable={false} />
          ) : (
            <div style={{ height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', color: B.textMuted, fontSize: 14 }}>
              {admin ? 'Click "Upload Drawing" to load the stairwell image' : 'Waiting for admin to upload stairwell drawing'}
            </div>
          )}
          {drawingUrl && landings.map(landing => {
            const color = getStatusColor(landing, B)
            return (
              <div key={landing.id}
                onMouseDown={(e) => handleMouseDown(e, landing.id)}
                onTouchStart={(e) => handleTouchStart(e, landing.id)}
                title={`Landing ${landing.number} — ${getLevelLabel(landing.number)}`}
                style={{
                  position: 'absolute', left: `${landing.pos_x || 50}%`, top: `${landing.pos_y || 50}%`, transform: 'translate(-50%, -50%)',
                  width: 26, height: 26, borderRadius: '50%', background: color,
                  border: dragging === landing.id ? '3px solid #fff' : '2px solid rgba(255,255,255,0.8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: admin ? 'grab' : 'default',
                  zIndex: dragging === landing.id ? 999 : 10,
                  boxShadow: dragging === landing.id ? '0 0 12px rgba(0,0,0,0.5)' : '0 1px 4px rgba(0,0,0,0.4)',
                  fontSize: 11, fontWeight: 800, color: '#fff', userSelect: 'none', touchAction: 'none',
                }}>{landing.number}</div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── GENERIC TABLE VIEW (used for both landings and lobby slabs) ──
function GenericTableView({ items, user, tableName, labelFn, theme, onUpdate, notes, onNotesUpdate, photos, onPhotosUpdate }) {
  const B = THEMES[theme]
  const isLandings = tableName === 'landings'
  const itemType = isLandings ? 'landing' : 'lobby_slab'
  const [newNote, setNewNote] = useState({})
  const [viewingPhotos, setViewingPhotos] = useState(null)
  const photoInputRefs = useRef({})

  const getItemPhotos = (itemId, field) => {
    return (photos || []).filter(p => p.item_type === itemType && p.item_id === itemId && p.field === field)
  }

  const handlePhotoUpload = async (item, field, e) => {
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop()
    const fileName = `${itemType}_${item.number}_${field}_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('photos').upload(fileName, file, { upsert: false })
    if (error) { alert('Upload failed: ' + error.message); return }
    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName)
    if (urlData?.publicUrl) {
      await supabase.from('photos').insert({
        item_type: itemType,
        item_id: item.id,
        field,
        file_name: fileName,
        url: urlData.publicUrl,
        uploaded_by: `${user.name} (${user.company})`,
      })
      await supabase.from('activity_log').insert({
        user_name: user.name, company: user.company,
        action: `Photo uploaded (${field})`,
        details: `${isLandings ? 'Landing' : 'Slab'} ${item.number} (${labelFn(item)}) - ${field} photo added`,
        device_info: navigator.userAgent?.substring(0, 100) || '',
      })
      onPhotosUpdate()
    }
    e.target.value = ''
  }

  const handleDeletePhoto = async (photo) => {
    if (!isAdmin(user)) return
    await supabase.storage.from('photos').remove([photo.file_name])
    await supabase.from('photos').delete().eq('id', photo.id)
    onPhotosUpdate()
  }

  const handleToggle = async (item, field) => {
    if (!canEdit(user, field)) return
    const newVal = !item[`${field}_complete`]
    const updates = {
      [`${field}_complete`]: newVal,
      [`${field}_by`]: newVal ? `${user.name} (${user.company})` : null,
    }
    if (!newVal) updates[`${field}_date`] = null
    await supabase.from(tableName).update(updates).eq('id', item.id)
    await supabase.from('activity_log').insert({
      user_name: user.name, company: user.company,
      action: newVal ? `Completed ${field}` : `Unchecked ${field}`,
      details: `${isLandings ? 'Landing' : 'Slab'} ${item.number} (${labelFn(item)}) - ${field} ${newVal ? 'completed' : 'unchecked'}`,
      device_info: navigator.userAgent?.substring(0, 100) || '',
    })
    onUpdate()
  }

  const handleDate = async (item, field, value) => {
    if (!canEdit(user, field)) return
    const isoVal = value ? new Date(value).toISOString() : null
    await supabase.from(tableName).update({ [`${field}_date`]: isoVal }).eq('id', item.id)
    if (value) {
      await supabase.from('activity_log').insert({
        user_name: user.name, company: user.company,
        action: `Set ${field} date`,
        details: `${isLandings ? 'Landing' : 'Slab'} ${item.number} (${labelFn(item)}) - ${field} date set to ${value}`,
        device_info: navigator.userAgent?.substring(0, 100) || '',
      })
    }
    onUpdate()
  }

  const handleAddNote = async (itemId) => {
    const msg = (newNote[itemId] || '').trim()
    if (!msg) return
    await supabase.from('notes').insert({
      item_type: itemType,
      item_id: itemId,
      user_name: user.name,
      company: user.company,
      message: msg,
    })
    setNewNote(prev => ({ ...prev, [itemId]: '' }))
    onNotesUpdate()
  }

  const handleDeleteNote = async (noteId) => {
    if (!isAdmin(user)) return
    await supabase.from('notes').delete().eq('id', noteId)
    onNotesUpdate()
  }

  const getItemNotes = (itemId) => {
    return (notes || []).filter(n => n.item_type === itemType && n.item_id === itemId)
  }

  const dtInputStyle = (allowed) => ({
    padding: '3px 6px', background: B.inputBg, border: `1px solid ${B.cardBorder}`,
    borderRadius: 4, color: B.text, fontSize: 11, outline: 'none', boxSizing: 'border-box',
    opacity: allowed ? 1 : 0.4, cursor: allowed ? 'pointer' : 'not-allowed',
    colorScheme: B.colorScheme,
  })

  const handlePrintTable = () => {
    window.print()
  }

  const sorted = [...items].sort((a, b) => a.number - b.number)

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
      {/* Print header - hidden on screen */}
      <div className="print-only" style={{ display: 'none', marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#000' }}>Moxy Hotel — {isLandings ? 'Stair Landing Tracker' : 'Lobby Slab Tracker'}</h1>
        <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0 0' }}>City Scaffold Ltd — Printed {new Date().toLocaleString('en-NZ')}</p>
      </div>

      <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
        <span style={{ color: B.text, fontWeight: 700, fontSize: 16 }}>{isLandings ? 'Stair Landings' : 'Lobby Slabs'}</span>
        <span style={{ color: B.textMuted, fontSize: 12 }}>({items.length} items)</span>
        <div style={{ flex: 1 }} />
        <button onClick={handlePrintTable} style={{ padding: '6px 14px', background: B.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📄 Export PDF</button>
      </div>

      {/* Interactive table (screen) */}
      <table className="no-print" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${B.cardBorder}` }}>
            {['#', 'LEVEL', 'SHORE', 'SHORE DATE/TIME', 'SHORE BY', 'STEEL', 'STEEL DATE/TIME', 'STEEL BY', 'POUR', 'POUR DATE/TIME', 'POUR BY', 'NOTES'].map(h => (
              <th key={h} style={{ color: B.textMuted, fontSize: 11, fontWeight: 600, padding: '10px 6px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(l => {
            const level = labelFn(l)
            return (
              <tr key={l.id} style={{ borderBottom: `1px solid ${B.cardBorder}` }}>
                <td style={{ padding: '6px', textAlign: 'center' }}>
                  <span style={{ display: 'inline-flex', width: 28, height: 28, borderRadius: '50%', background: getStatusColor(l, B), color: '#fff', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{l.number}</span>
                </td>
                <td style={{ padding: '6px', color: B.text, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{level}</td>
                {['shore', 'steel', 'pour'].map(field => {
                  const allowed = canEdit(user, field)
                  const fieldPhotos = getItemPhotos(l.id, field)
                  const refKey = `${l.id}-${field}`
                  return [
                    <td key={`${l.id}-${field}-cb`} style={{ padding: '6px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <input type="checkbox" checked={!!l[`${field}_complete`]} onChange={() => handleToggle(l, field)} disabled={!allowed}
                          style={{ width: 18, height: 18, cursor: allowed ? 'pointer' : 'not-allowed', accentColor: field === 'shore' ? B.blue : field === 'steel' ? B.yellow : B.green, opacity: allowed ? 1 : 0.4 }} />
                        <input type="file" accept="image/*" capture="environment" ref={el => photoInputRefs.current[refKey] = el} onChange={(e) => handlePhotoUpload(l, field, e)} style={{ display: 'none' }} />
                        {allowed && (
                          <button onClick={() => photoInputRefs.current[refKey]?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 0, opacity: 0.7 }} title="Add photo">📷</button>
                        )}
                        {fieldPhotos.length > 0 && (
                          <button onClick={() => setViewingPhotos({ itemId: l.id, field, number: l.number })} style={{ background: B.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 9, fontWeight: 700, padding: '1px 5px', cursor: 'pointer' }} title="View photos">{fieldPhotos.length}</button>
                        )}
                      </div>
                    </td>,
                    <td key={`${l.id}-${field}-date`} style={{ padding: '6px' }}>
                      <input type="datetime-local" defaultValue={toLocalInput(l[`${field}_date`])} onBlur={(e) => handleDate(l, field, e.target.value)} disabled={!allowed} style={dtInputStyle(allowed)} />
                    </td>,
                    <td key={`${l.id}-${field}-by`} style={{ padding: '6px', color: B.textMuted, fontSize: 11, whiteSpace: 'nowrap' }}>{l[`${field}_by`] || '-'}</td>,
                  ]
                })}
                <td style={{ padding: '6px', minWidth: 220, verticalAlign: 'top' }}>
                  {getItemNotes(l.id).map(n => (
                    <div key={n.id} style={{ marginBottom: 4, fontSize: 11, lineHeight: 1.4, display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                      <span style={{ color: COMPANY_COLORS[n.company] || B.textMuted, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>{n.user_name}:</span>
                      <span style={{ color: B.text, flex: 1 }}>{n.message}</span>
                      {isAdmin(user) && <button onClick={() => handleDeleteNote(n.id)} style={{ background: 'none', border: 'none', color: B.red, cursor: 'pointer', fontSize: 10, padding: '0 2px', flexShrink: 0, opacity: 0.6 }} title="Delete note">✕</button>}
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 4, marginTop: getItemNotes(l.id).length > 0 ? 4 : 0 }}>
                    <input
                      value={newNote[l.id] || ''}
                      onChange={(e) => setNewNote(prev => ({ ...prev, [l.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(l.id) }}
                      placeholder="Add note..."
                      style={{ flex: 1, padding: '3px 6px', background: B.inputBg, border: `1px solid ${B.cardBorder}`, borderRadius: 4, color: B.text, fontSize: 11, outline: 'none', boxSizing: 'border-box' }}
                    />
                    <button onClick={() => handleAddNote(l.id)} style={{ padding: '3px 8px', background: B.primary, color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+</button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Print-friendly table (print only) */}
      <table className="print-table print-only" style={{ display: 'none' }}>
        <thead>
          <tr>
            <th>#</th><th>Level</th><th>Status</th>
            <th>Shore ✓</th><th>Shore Date</th><th>Shore By</th>
            <th>Steel ✓</th><th>Steel Date</th><th>Steel By</th>
            <th>Pour ✓</th><th>Pour Date</th><th>Pour By</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(l => (
            <tr key={l.id}>
              <td style={{ fontWeight: 700, textAlign: 'center' }}>{l.number}</td>
              <td>{labelFn(l)}</td>
              <td>
                <span className="print-status" style={{ background: l.pour_complete ? '#22C55E' : l.steel_complete ? '#EAB308' : l.shore_complete ? '#4A9AB5' : '#ef4444' }}></span>
                {getStatusText(l)}
              </td>
              <td style={{ textAlign: 'center' }}>{l.shore_complete ? '✅' : '—'}</td>
              <td>{formatNZDate(l.shore_date)}</td>
              <td>{l.shore_by || '-'}</td>
              <td style={{ textAlign: 'center' }}>{l.steel_complete ? '✅' : '—'}</td>
              <td>{formatNZDate(l.steel_date)}</td>
              <td>{l.steel_by || '-'}</td>
              <td style={{ textAlign: 'center' }}>{l.pour_complete ? '✅' : '—'}</td>
              <td>{formatNZDate(l.pour_date)}</td>
              <td>{l.pour_by || '-'}</td>
              <td>{getItemNotes(l.id).map(n => `${n.user_name}: ${n.message}`).join(' | ') || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Photo viewer modal */}
      {viewingPhotos && (() => {
        const vp = viewingPhotos
        const vpPhotos = getItemPhotos(vp.itemId, vp.field)
        return (
          <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewingPhotos(null)}>
            <div style={{ background: B.card, borderRadius: 12, padding: 20, maxWidth: 700, maxHeight: '85vh', overflow: 'auto', width: '90%' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ color: B.text, fontWeight: 700, fontSize: 16 }}>{isLandings ? 'Landing' : 'Slab'} {vp.number} — {vp.field} photos</span>
                <div style={{ flex: 1 }} />
                <button onClick={() => setViewingPhotos(null)} style={{ background: 'none', border: 'none', color: B.textMuted, fontSize: 22, cursor: 'pointer' }}>✕</button>
              </div>
              {vpPhotos.length === 0 && <p style={{ color: B.textMuted, fontSize: 13 }}>No photos yet</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {vpPhotos.map(p => (
                  <div key={p.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `1px solid ${B.cardBorder}` }}>
                    <a href={p.url} target="_blank" rel="noopener noreferrer">
                      <img src={p.url} alt="" style={{ width: '100%', display: 'block', cursor: 'pointer' }} />
                    </a>
                    <div style={{ padding: '6px 8px', fontSize: 10, color: B.textMuted }}>
                      {p.uploaded_by} — {formatNZDate(p.created_at)}
                    </div>
                    {isAdmin(user) && (
                      <button onClick={() => handleDeletePhoto(p)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(220,38,38,0.9)', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, padding: '2px 6px', cursor: 'pointer' }}>🗑️</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
function ActivityView({ logs, theme, onDelete }) {
  const B = THEMES[theme]
  const [filter, setFilter] = useState('All')
  const companies = ['All', ...COMPANIES]
  const filtered = filter === 'All' ? logs : logs.filter(l => l.company === filter)

  const handleDelete = async (id) => {
    await supabase.from('activity_log').delete().eq('id', id)
    onDelete()
  }

  const handleClearAll = async () => {
    if (!confirm('Delete ALL activity logs? This cannot be undone.')) return
    if (filter === 'All') {
      await supabase.from('activity_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    } else {
      await supabase.from('activity_log').delete().eq('company', filter)
    }
    onDelete()
  }

  const exportCSV = () => {
    const header = 'Timestamp,User,Company,Action,Details\n'
    const rows = filtered.map(l => `"${new Date(l.created_at).toLocaleString('en-NZ')}","${l.user_name}","${l.company}","${l.action}","${l.details}"`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `moxy_activity_${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  const exportPDF = () => {
    window.print()
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
      {/* Print header */}
      <div className="print-only" style={{ display: 'none', marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#000' }}>Moxy Hotel — Activity Log</h1>
        <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0 0' }}>City Scaffold Ltd — {filter !== 'All' ? `Filtered: ${filter} — ` : ''}Printed {new Date().toLocaleString('en-NZ')}</p>
      </div>

      <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <label style={{ color: B.textMuted, fontSize: 12, fontWeight: 600 }}>Filter:</label>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '6px 10px', background: B.inputBg, border: `1px solid ${B.cardBorder}`, borderRadius: 6, color: B.text, fontSize: 12 }}>
          {companies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button onClick={exportPDF} style={{ padding: '6px 14px', background: B.dark, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📄 Export PDF</button>
        <button onClick={exportCSV} style={{ padding: '6px 14px', background: B.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📊 Export CSV</button>
        <button onClick={handleClearAll} style={{ padding: '6px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🗑️ Clear {filter === 'All' ? 'All' : filter}</button>
      </div>

      {/* Screen table */}
      <table className="no-print" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${B.cardBorder}` }}>
            {['Time', 'User', 'Company', 'Action', 'Details', ''].map(h => (
              <th key={h} style={{ color: B.textMuted, fontSize: 11, fontWeight: 600, padding: '10px 8px', textAlign: 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: B.textMuted }}>No activity yet</td></tr>}
          {filtered.map((l, i) => (
            <tr key={l.id || i} style={{ borderBottom: `1px solid ${B.cardBorder}` }}>
              <td style={{ padding: '8px', color: B.textMuted, fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(l.created_at).toLocaleString('en-NZ')}</td>
              <td style={{ padding: '8px', color: B.text, fontSize: 12, fontWeight: 600 }}>{l.user_name}</td>
              <td style={{ padding: '8px', color: B.textMuted, fontSize: 12 }}>{l.company}</td>
              <td style={{ padding: '8px', color: B.text, fontSize: 12 }}>{l.action}</td>
              <td style={{ padding: '8px', color: B.textMuted, fontSize: 12 }}>{l.details}</td>
              <td style={{ padding: '8px', textAlign: 'center' }}>
                <button onClick={() => handleDelete(l.id)} style={{ background: 'none', border: 'none', color: B.red, cursor: 'pointer', fontSize: 12, padding: '2px 4px', opacity: 0.7 }} title="Delete">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Print table */}
      <table className="print-table print-only" style={{ display: 'none' }}>
        <thead>
          <tr><th>Time</th><th>User</th><th>Company</th><th>Action</th><th>Details</th></tr>
        </thead>
        <tbody>
          {filtered.map((l, i) => (
            <tr key={l.id || i}>
              <td>{new Date(l.created_at).toLocaleString('en-NZ')}</td>
              <td>{l.user_name}</td>
              <td>{l.company}</td>
              <td>{l.action}</td>
              <td>{l.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── CHAT VIEW ──────────────────────────────────────────────────
function ChatView({ messages, user, theme, onSend, registeredUsers }) {
  const B = THEMES[theme]
  const [msg, setMsg] = useState('')
  const [activeChannel, setActiveChannel] = useState('team')
  const chatEndRef = useRef(null)

  // Get other users (not me)
  const otherUsers = registeredUsers.filter(u => u.name !== user.name)

  // Filter messages for current channel
  const channelMessages = messages.filter(m => {
    if (activeChannel === 'team') {
      return m.chat_type === 'team' || !m.chat_type
    }
    // DM: show messages between me and selected person
    return m.chat_type === 'dm' && (
      (m.user_name === user.name && m.recipient_name === activeChannel) ||
      (m.user_name === activeChannel && m.recipient_name === user.name)
    )
  })

  // Count unread-style indicator (messages from others in each DM)
  const getDmCount = (personName) => {
    return messages.filter(m =>
      m.chat_type === 'dm' && m.user_name === personName && m.recipient_name === user.name
    ).length
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [channelMessages.length, activeChannel])

  const handleSend = async () => {
    const text = msg.trim()
    if (!text) return
    const insert = {
      user_name: user.name,
      company: user.company,
      message: text,
      chat_type: activeChannel === 'team' ? 'team' : 'dm',
    }
    if (activeChannel !== 'team') {
      insert.recipient_name = activeChannel
    }
    await supabase.from('chat_messages').insert(insert)
    setMsg('')
    onSend()
  }

  const handleDelete = async (id) => {
    if (!isAdmin(user)) return
    await supabase.from('chat_messages').delete().eq('id', id)
    onSend()
  }

  const exportCSV = () => {
    const label = activeChannel === 'team' ? 'Team Chat' : `DM with ${activeChannel}`
    const header = 'Timestamp,User,Company,Message\n'
    const rows = channelMessages.map(m => `"${new Date(m.created_at).toLocaleString('en-NZ')}","${m.user_name}","${m.company}","${m.message.replace(/"/g, '""')}"`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `moxy_chat_${activeChannel === 'team' ? 'team' : activeChannel}_${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  const exportPDF = () => { window.print() }

  // Group messages by date
  const groupByDate = (msgs) => {
    const groups = {}
    msgs.forEach(m => {
      const date = new Date(m.created_at).toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      if (!groups[date]) groups[date] = []
      groups[date].push(m)
    })
    return groups
  }

  const grouped = groupByDate(channelMessages)
  const channelLabel = activeChannel === 'team' ? 'Team Chat' : `DM — ${activeChannel}`

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div className="no-print" style={{ width: 220, minWidth: 220, background: B.card, borderRight: `1px solid ${B.cardBorder}`, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${B.cardBorder}` }}>
          <span style={{ color: B.textMuted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Channels</span>
        </div>

        {/* Team chat */}
        <button onClick={() => setActiveChannel('team')} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
          background: activeChannel === 'team' ? (theme === 'dark' ? 'rgba(74,154,181,0.15)' : 'rgba(74,154,181,0.1)') : 'transparent',
          borderLeft: activeChannel === 'team' ? `3px solid ${B.primary}` : '3px solid transparent',
        }}>
          <span style={{ fontSize: 16 }}>👥</span>
          <div>
            <div style={{ color: activeChannel === 'team' ? B.text : B.textMuted, fontSize: 13, fontWeight: activeChannel === 'team' ? 700 : 500 }}>Team Chat</div>
            <div style={{ color: B.textMuted, fontSize: 10 }}>Everyone</div>
          </div>
        </button>

        <div style={{ padding: '12px 14px 6px', borderTop: `1px solid ${B.cardBorder}` }}>
          <span style={{ color: B.textMuted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Direct Messages</span>
        </div>

        {otherUsers.map(u => {
          const dmCount = getDmCount(u.name)
          const companyColor = COMPANY_COLORS[u.company] || B.textMuted
          const isActive = activeChannel === u.name
          return (
            <button key={u.name} onClick={() => setActiveChannel(u.name)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
              background: isActive ? (theme === 'dark' ? 'rgba(74,154,181,0.15)' : 'rgba(74,154,181,0.1)') : 'transparent',
              borderLeft: isActive ? `3px solid ${B.primary}` : '3px solid transparent',
            }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: companyColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: isActive ? B.text : B.textMuted, fontSize: 12, fontWeight: isActive ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                <div style={{ color: companyColor, fontSize: 10 }}>{u.company}</div>
              </div>
              {dmCount > 0 && (
                <span style={{ background: companyColor, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10, flexShrink: 0 }}>{dmCount}</span>
              )}
            </button>
          )
        })}

        {otherUsers.length === 0 && (
          <div style={{ padding: '12px 14px', color: B.textMuted, fontSize: 11 }}>No other users registered yet</div>
        )}
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Chat header bar */}
        <div className="no-print" style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 10, background: B.card, borderBottom: `1px solid ${B.cardBorder}` }}>
          <span style={{ color: B.text, fontWeight: 700, fontSize: 14 }}>{channelLabel}</span>
          <span style={{ color: B.textMuted, fontSize: 11 }}>({channelMessages.length} messages)</span>
          <div style={{ flex: 1 }} />
          <button onClick={exportPDF} style={{ padding: '5px 12px', background: B.dark, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>📄 PDF</button>
          <button onClick={exportCSV} style={{ padding: '5px 12px', background: B.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>📊 CSV</button>
        </div>

        {/* Print header */}
        <div className="print-only" style={{ display: 'none', marginBottom: 16, padding: '0 20px' }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#000' }}>Moxy Hotel — {channelLabel}</h1>
          <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0 0' }}>City Scaffold Ltd — Printed {new Date().toLocaleString('en-NZ')}</p>
        </div>

        {/* Messages */}
        <div className="no-print" style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          {channelMessages.length === 0 && (
            <div style={{ textAlign: 'center', color: B.textMuted, marginTop: 60, fontSize: 14 }}>
              {activeChannel === 'team' ? 'No messages yet. Start the team conversation!' : `No messages with ${activeChannel} yet.`}
            </div>
          )}
          {Object.entries(grouped).map(([date, msgs]) => (
            <div key={date}>
              <div style={{ textAlign: 'center', margin: '16px 0 12px', position: 'relative' }}>
                <span style={{ background: B.bg, padding: '0 12px', color: B.textMuted, fontSize: 11, fontWeight: 600, position: 'relative', zIndex: 1 }}>{date}</span>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: B.cardBorder, zIndex: 0 }} />
              </div>
              {msgs.map(m => {
                const isMe = m.user_name === user.name
                const companyColor = COMPANY_COLORS[m.company] || B.textMuted
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                    <div style={{
                      maxWidth: '70%', padding: '8px 12px', borderRadius: 10,
                      background: isMe ? B.primary : B.card,
                      border: isMe ? 'none' : `1px solid ${B.cardBorder}`,
                      borderBottomRightRadius: isMe ? 2 : 10,
                      borderBottomLeftRadius: isMe ? 10 : 2,
                    }}>
                      {!isMe && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: companyColor, marginBottom: 2 }}>{m.user_name} <span style={{ fontWeight: 400, opacity: 0.7 }}>({m.company})</span></div>
                      )}
                      <div style={{ fontSize: 13, color: isMe ? '#fff' : B.text, lineHeight: 1.4, wordBreak: 'break-word' }}>{m.message}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.6)' : B.textMuted }}>
                          {new Date(m.created_at).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isAdmin(user) && (
                          <button onClick={() => handleDelete(m.id)} style={{ background: 'none', border: 'none', color: isMe ? 'rgba(255,255,255,0.6)' : B.red, cursor: 'pointer', fontSize: 9, padding: 0, opacity: 0.7 }} title="Delete message">✕</button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Print messages */}
        <table className="print-table print-only" style={{ display: 'none', margin: '0 20px' }}>
          <thead>
            <tr><th>Time</th><th>From</th><th>Company</th><th>Message</th></tr>
          </thead>
          <tbody>
            {channelMessages.map(m => (
              <tr key={m.id}>
                <td>{new Date(m.created_at).toLocaleString('en-NZ')}</td>
                <td>{m.user_name}</td>
                <td>{m.company}</td>
                <td>{m.message}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Message input */}
        <div className="no-print" style={{ padding: '12px 20px', background: B.card, borderTop: `1px solid ${B.cardBorder}`, display: 'flex', gap: 10 }}>
          <input
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={activeChannel === 'team' ? 'Message team...' : `Message ${activeChannel}...`}
            style={{ flex: 1, padding: '10px 14px', background: B.inputBg, border: `1px solid ${B.cardBorder}`, borderRadius: 8, color: B.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
          <button onClick={handleSend} style={{ padding: '10px 24px', background: B.primary, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Send</button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN APP ───────────────────────────────────────────────────
export default function Home() {
  const [user, setUser] = useState(null)
  const [landings, setLandings] = useState([])
  const [lobbySlabs, setLobbySlabs] = useState([])
  const [logs, setLogs] = useState([])
  const [notes, setNotes] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [registeredUsers, setRegisteredUsers] = useState([])
  const [photos, setPhotos] = useState([])
  const [activeTab, setActiveTab] = useState('Diagram')
  const [drawingUrl, setDrawingUrl] = useState('')
  const [theme, setTheme] = useState('dark')
  const [tracker, setTracker] = useState('landings')

  const B = THEMES[theme]

  useEffect(() => {
    const saved = sessionStorage.getItem('moxy_user')
    if (saved) setUser(JSON.parse(saved))
    const savedTheme = localStorage.getItem('moxy_theme')
    if (savedTheme) setTheme(savedTheme)
  }, [])

  useEffect(() => { localStorage.setItem('moxy_theme', theme) }, [theme])

  const loadLandings = async () => { const { data } = await supabase.from('landings').select('*').order('number'); if (data) setLandings(data) }
  const loadLobbySlabs = async () => { const { data } = await supabase.from('lobby_slabs').select('*').order('number'); if (data) setLobbySlabs(data) }
  const loadLogs = async () => { const { data } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(200); if (data) setLogs(data) }
  const loadNotes = async () => { const { data } = await supabase.from('notes').select('*').order('created_at', { ascending: true }); if (data) setNotes(data) }
  const loadChat = async () => { const { data } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: true }); if (data) setChatMessages(data) }
  const loadUsers = async () => { const { data } = await supabase.from('users').select('name, company').order('name'); if (data) setRegisteredUsers(data) }
  const loadPhotos = async () => { const { data } = await supabase.from('photos').select('*').order('created_at', { ascending: true }); if (data) setPhotos(data) }

  useEffect(() => {
    if (!user) return
    loadLandings(); loadLobbySlabs(); loadLogs(); loadNotes(); loadChat(); loadUsers(); loadPhotos()
    const landingSub = supabase.channel('landings-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'landings' }, () => loadLandings()).subscribe()
    const lobbySub = supabase.channel('lobby-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'lobby_slabs' }, () => loadLobbySlabs()).subscribe()
    const activitySub = supabase.channel('activity-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'activity_log' }, () => loadLogs()).subscribe()
    const notesSub = supabase.channel('notes-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => loadNotes()).subscribe()
    const chatSub = supabase.channel('chat-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => loadChat()).subscribe()
    const photosSub = supabase.channel('photos-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => loadPhotos()).subscribe()
    return () => { supabase.removeChannel(landingSub); supabase.removeChannel(lobbySub); supabase.removeChannel(activitySub); supabase.removeChannel(notesSub); supabase.removeChannel(chatSub); supabase.removeChannel(photosSub) }
  }, [user])

  const handleLogin = (userData) => { setUser(userData); sessionStorage.setItem('moxy_user', JSON.stringify(userData)) }
  const handleLogout = () => { setUser(null); sessionStorage.removeItem('moxy_user') }

  if (!user) return <LoginScreen onLogin={handleLogin} />

  const lobbyLabelFn = (slab) => slab.label || `Slab ${slab.number}`
  const landingLabelFn = (landing) => getLevelLabel(landing.number)

  return (
    <div style={{ minHeight: '100vh', background: B.bg, color: B.text, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: getPrintStyles(theme) }} />
      <Header user={user} landings={landings} lobbySlabs={lobbySlabs} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} theme={theme} setTheme={setTheme} tracker={tracker} setTracker={setTracker} />

      {/* STAIR LANDINGS */}
      {tracker === 'landings' && activeTab === 'Diagram' && (
        <DiagramView landings={landings} setLandings={setLandings} user={user} drawingUrl={drawingUrl} setDrawingUrl={setDrawingUrl} theme={theme} />
      )}
      {tracker === 'landings' && activeTab === 'Table' && (
        <GenericTableView items={landings} user={user} tableName="landings" labelFn={landingLabelFn} theme={theme} onUpdate={loadLandings} notes={notes} onNotesUpdate={loadNotes} photos={photos} onPhotosUpdate={loadPhotos} />
      )}

      {/* LOBBY SLABS */}
      {tracker === 'lobby' && activeTab === 'Table' && (
        <GenericTableView items={lobbySlabs} user={user} tableName="lobby_slabs" labelFn={lobbyLabelFn} theme={theme} onUpdate={loadLobbySlabs} notes={notes} onNotesUpdate={loadNotes} photos={photos} onPhotosUpdate={loadPhotos} />
      )}

      {/* ACTIVITY (shared) */}
      {activeTab === 'Activity' && (
        <ActivityView logs={logs} theme={theme} onDelete={loadLogs} />
      )}

      {/* CHAT */}
      {activeTab === 'Chat' && (
        <ChatView messages={chatMessages} user={user} theme={theme} onSend={loadChat} registeredUsers={registeredUsers} />
      )}
    </div>
  )
}
