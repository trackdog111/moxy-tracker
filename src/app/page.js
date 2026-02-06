'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uvecrllugptstymxnxrj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2ZWNybGx1Z3B0c3R5bXhueHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjcxMjQsImV4cCI6MjA4NTgwMzEyNH0.SgNTXQoo9JJZwfcjK6GcXrDqphzpG-6XEiua_wRpb0Q'
const supabase = createClient(supabaseUrl, supabaseKey)

const BRAND = {
  primary: '#4A9AB5', dark: '#2D6E7E', bg: '#1a1f2e', card: '#232838',
  cardBorder: '#2e3446', text: '#f1f5f9', textMuted: '#94a3b8',
  red: '#ef4444', blue: '#4A9AB5', yellow: '#EAB308', green: '#22C55E',
}

const INVITE_CODES = {
  'CS-8X4M': 'City Scaffold',
  'CMP-7K2N': 'CMP Construction',
  'DOM-3P9W': 'Dominion Constructors',
  'NAU-5R6J': 'Nauhria',
}

const COMPANIES = [...new Set(Object.values(INVITE_CODES))]

function getStatusColor(landing) {
  if (landing.pour_complete) return BRAND.green
  if (landing.steel_complete) return BRAND.yellow
  if (landing.shore_complete) return BRAND.blue
  return BRAND.red
}

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const inputStyle = { width: '100%', padding: '10px 12px', background: BRAND.bg, border: `1px solid ${BRAND.cardBorder}`, borderRadius: 8, color: BRAND.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }

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
    <div style={{ minHeight: '100vh', background: BRAND.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}`, borderRadius: 12, padding: 40, width: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, background: BRAND.primary, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff' }}>CS</div>
          <span style={{ color: BRAND.text, fontWeight: 700, fontSize: 18 }}>Moxy Hotel</span>
        </div>
        <p style={{ color: BRAND.textMuted, fontSize: 13, marginBottom: 20 }}>Stair Landing Tracker</p>
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderRadius: 8, overflow: 'hidden', border: `1px solid ${BRAND.cardBorder}` }}>
          <button onClick={() => { setMode('login'); setError('') }} style={{ flex: 1, padding: '8px', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: mode === 'login' ? BRAND.primary : BRAND.bg, color: mode === 'login' ? '#fff' : BRAND.textMuted }}>Log In</button>
          <button onClick={() => { setMode('register'); setError('') }} style={{ flex: 1, padding: '8px', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: mode === 'register' ? BRAND.primary : BRAND.bg, color: mode === 'register' ? '#fff' : BRAND.textMuted }}>Register</button>
        </div>
        <label style={{ color: BRAND.textMuted, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>YOUR NAME</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Shane" style={{ ...inputStyle, marginBottom: 16 }} onKeyDown={handleKey} />
        <label style={{ color: BRAND.textMuted, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>PASSWORD</label>
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder={mode === 'register' ? 'Create a password (min 4 chars)' : 'Enter your password'} style={{ ...inputStyle, marginBottom: 16 }} onKeyDown={handleKey} />
        {mode === 'register' && (
          <>
            <label style={{ color: BRAND.textMuted, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>INVITE CODE</label>
            <input value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="Enter code from your supervisor" style={{ ...inputStyle, marginBottom: 16 }} onKeyDown={handleKey} />
          </>
        )}
        {error && <p style={{ color: BRAND.red, fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button onClick={mode === 'login' ? handleLogin : handleRegister} disabled={loading} style={{ width: '100%', padding: '12px', background: BRAND.primary, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Register'}
        </button>
      </div>
    </div>
  )
}

function Header({ user, landings, activeTab, setActiveTab, onLogout }) {
  const shored = landings.filter(l => l.shore_complete && !l.steel_complete && !l.pour_complete).length
  const steel = landings.filter(l => l.steel_complete && !l.pour_complete).length
  const poured = landings.filter(l => l.pour_complete).length
  const notStarted = landings.length - shored - steel - poured
  const tabs = ['Diagram', 'Table', 'Activity', 'PDF']
  return (
    <div style={{ background: BRAND.card, borderBottom: `1px solid ${BRAND.cardBorder}`, padding: '0 20px', display: 'flex', alignItems: 'center', height: 56, gap: 20, position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, background: BRAND.primary, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, color: '#fff' }}>CS</div>
        <div>
          <div style={{ color: BRAND.text, fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Moxy Hotel — Stair Landing Tracker</div>
          <div style={{ color: BRAND.textMuted, fontSize: 11 }}>Logged in as {user.name} ({user.company})</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginLeft: 20 }}>
        <span style={{ color: BRAND.red, fontWeight: 700, fontSize: 14 }}>{notStarted} <span style={{ color: BRAND.textMuted, fontWeight: 400, fontSize: 11 }}>Not Started</span></span>
        <span style={{ color: BRAND.blue, fontWeight: 700, fontSize: 14 }}>{shored} <span style={{ color: BRAND.textMuted, fontWeight: 400, fontSize: 11 }}>Shored</span></span>
        <span style={{ color: BRAND.yellow, fontWeight: 700, fontSize: 14 }}>{steel} <span style={{ color: BRAND.textMuted, fontWeight: 400, fontSize: 11 }}>Steel</span></span>
        <span style={{ color: BRAND.green, fontWeight: 700, fontSize: 14 }}>{poured} <span style={{ color: BRAND.textMuted, fontWeight: 400, fontSize: 11 }}>Poured</span></span>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 4 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: activeTab === t ? BRAND.primary : 'transparent', color: activeTab === t ? '#fff' : BRAND.textMuted }}>{t}</button>
        ))}
      </div>
      <button onClick={onLogout} style={{ padding: '6px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Logout</button>
    </div>
  )
}

function DiagramView({ landings, setLandings, user, drawingUrl, setDrawingUrl }) {
  const containerRef = useRef(null)
  const [dragging, setDragging] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(70)
  const fileInputRef = useRef(null)

  const handleUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { setDrawingUrl(ev.target.result); localStorage.setItem('moxy_drawing', ev.target.result) }
    reader.readAsDataURL(file)
  }

  useEffect(() => { const saved = localStorage.getItem('moxy_drawing'); if (saved) setDrawingUrl(saved) }, [])

  const handleMouseDown = (e, id) => {
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
      <div style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 10, background: BRAND.card, borderBottom: `1px solid ${BRAND.cardBorder}` }}>
        <input type="file" ref={fileInputRef} accept="image/*,.pdf" onChange={handleUpload} style={{ display: 'none' }} />
        <button onClick={() => fileInputRef.current?.click()} style={{ padding: '6px 14px', background: BRAND.bg, border: `1px solid ${BRAND.cardBorder}`, borderRadius: 6, color: BRAND.text, fontSize: 12, cursor: 'pointer' }}>Upload Drawing</button>
        <button onClick={() => setZoom(z => Math.max(20, z - 10))} style={{ padding: '6px 10px', background: BRAND.bg, border: `1px solid ${BRAND.cardBorder}`, borderRadius: 6, color: BRAND.text, fontSize: 14, cursor: 'pointer' }}>−</button>
        <span style={{ color: BRAND.textMuted, fontSize: 12, minWidth: 40, textAlign: 'center' }}>{zoom}%</span>
        <button onClick={() => setZoom(z => Math.min(200, z + 10))} style={{ padding: '6px 10px', background: BRAND.bg, border: `1px solid ${BRAND.cardBorder}`, borderRadius: 6, color: BRAND.text, fontSize: 14, cursor: 'pointer' }}>+</button>
        <span style={{ color: BRAND.textMuted, fontSize: 11, marginLeft: 10 }}>Drag numbered circles onto the landings. Positions save automatically.</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', background: '#111' }}>
        <div ref={containerRef} style={{ position: 'relative', width: `${zoom}%`, minHeight: 400, margin: '0 auto', userSelect: 'none' }}>
          {drawingUrl ? (
            <img src={drawingUrl} alt="Stair landings" style={{ width: '100%', display: 'block', pointerEvents: 'none' }} draggable={false} />
          ) : (
            <div style={{ height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BRAND.textMuted, fontSize: 14 }}>Click &quot;Upload Drawing&quot; to load the stairwell image</div>
          )}
          {drawingUrl && landings.map(landing => {
            const color = getStatusColor(landing)
            return (
              <div key={landing.id} onMouseDown={(e) => handleMouseDown(e, landing.id)} onTouchStart={(e) => handleTouchStart(e, landing.id)} style={{
                position: 'absolute', left: `${landing.pos_x || 50}%`, top: `${landing.pos_y || 50}%`, transform: 'translate(-50%, -50%)',
                width: 26, height: 26, borderRadius: '50%', background: color,
                border: dragging === landing.id ? '3px solid #fff' : '2px solid rgba(255,255,255,0.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab',
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

function TableView({ landings, user, onUpdate }) {
  const handleToggle = async (landing, field) => {
    const newVal = !landing[`${field}_complete`]
    await supabase.from('landings').update({
      [`${field}_complete`]: newVal,
      [`${field}_date`]: newVal ? new Date().toISOString() : null,
      [`${field}_by`]: newVal ? `${user.name} (${user.company})` : null,
    }).eq('id', landing.id)
    await supabase.from('activity_log').insert({
      user_name: user.name, company: user.company,
      action: newVal ? `Completed ${field}` : `Unchecked ${field}`,
      details: `Landing ${landing.number} - ${field} ${newVal ? 'completed' : 'unchecked'}`,
      device_info: navigator.userAgent?.substring(0, 100) || '',
    })
    onUpdate()
  }

  const handleNotes = async (landing, notes) => {
    await supabase.from('landings').update({ notes }).eq('id', landing.id)
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${BRAND.cardBorder}` }}>
            {['#', 'SHORE LOADING', 'SHORE DATE', 'SHORE BY', 'STEEL FIXING', 'STEEL DATE', 'STEEL BY', 'CONCRETE POUR', 'POUR DATE', 'POUR BY', 'NOTES'].map(h => (
              <th key={h} style={{ color: BRAND.textMuted, fontSize: 11, fontWeight: 600, padding: '10px 8px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {landings.sort((a, b) => a.number - b.number).map(l => (
            <tr key={l.id} style={{ borderBottom: `1px solid ${BRAND.cardBorder}` }}>
              <td style={{ padding: '8px', textAlign: 'center' }}>
                <span style={{ display: 'inline-flex', width: 28, height: 28, borderRadius: '50%', background: getStatusColor(l), color: '#fff', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{l.number}</span>
              </td>
              {['shore', 'steel', 'pour'].map(field => [
                <td key={`${l.id}-${field}-cb`} style={{ padding: '8px', textAlign: 'center' }}>
                  <input type="checkbox" checked={!!l[`${field}_complete`]} onChange={() => handleToggle(l, field)} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: field === 'shore' ? BRAND.blue : field === 'steel' ? BRAND.yellow : BRAND.green }} />
                </td>,
                <td key={`${l.id}-${field}-date`} style={{ padding: '8px', color: BRAND.textMuted, fontSize: 12 }}>{l[`${field}_date`] ? new Date(l[`${field}_date`]).toLocaleDateString('en-NZ') : '-'}</td>,
                <td key={`${l.id}-${field}-by`} style={{ padding: '8px', color: BRAND.textMuted, fontSize: 12 }}>{l[`${field}_by`] || '-'}</td>,
              ])}
              <td style={{ padding: '8px' }}>
                <input defaultValue={l.notes || ''} onBlur={(e) => handleNotes(l, e.target.value)} style={{ width: '100%', padding: '4px 8px', background: BRAND.bg, border: `1px solid ${BRAND.cardBorder}`, borderRadius: 4, color: BRAND.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ActivityView({ logs }) {
  const [filter, setFilter] = useState('All')
  const companies = ['All', ...COMPANIES]
  const filtered = filter === 'All' ? logs : logs.filter(l => l.company === filter)

  const exportCSV = () => {
    const header = 'Timestamp,User,Company,Action,Details\n'
    const rows = filtered.map(l => `"${new Date(l.created_at).toLocaleString('en-NZ')}","${l.user_name}","${l.company}","${l.action}","${l.details}"`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `moxy_activity_${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <label style={{ color: BRAND.textMuted, fontSize: 12, fontWeight: 600 }}>Filter:</label>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '6px 10px', background: BRAND.bg, border: `1px solid ${BRAND.cardBorder}`, borderRadius: 6, color: BRAND.text, fontSize: 12 }}>
          {companies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={exportCSV} style={{ padding: '6px 14px', background: BRAND.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>Export CSV</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${BRAND.cardBorder}` }}>
            {['Time', 'User', 'Company', 'Action', 'Details'].map(h => (
              <th key={h} style={{ color: BRAND.textMuted, fontSize: 11, fontWeight: 600, padding: '10px 8px', textAlign: 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: BRAND.textMuted }}>No activity yet</td></tr>}
          {filtered.map((l, i) => (
            <tr key={l.id || i} style={{ borderBottom: `1px solid ${BRAND.cardBorder}` }}>
              <td style={{ padding: '8px', color: BRAND.textMuted, fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(l.created_at).toLocaleString('en-NZ')}</td>
              <td style={{ padding: '8px', color: BRAND.text, fontSize: 12, fontWeight: 600 }}>{l.user_name}</td>
              <td style={{ padding: '8px', color: BRAND.textMuted, fontSize: 12 }}>{l.company}</td>
              <td style={{ padding: '8px', color: BRAND.text, fontSize: 12 }}>{l.action}</td>
              <td style={{ padding: '8px', color: BRAND.textMuted, fontSize: 12 }}>{l.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Home() {
  const [user, setUser] = useState(null)
  const [landings, setLandings] = useState([])
  const [logs, setLogs] = useState([])
  const [activeTab, setActiveTab] = useState('Diagram')
  const [drawingUrl, setDrawingUrl] = useState('')

  useEffect(() => { const saved = sessionStorage.getItem('moxy_user'); if (saved) setUser(JSON.parse(saved)) }, [])

  const loadLandings = async () => { const { data } = await supabase.from('landings').select('*').order('number'); if (data) setLandings(data) }
  const loadLogs = async () => { const { data } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(200); if (data) setLogs(data) }

  useEffect(() => {
    if (!user) return
    loadLandings(); loadLogs()
    const landingSub = supabase.channel('landings-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'landings' }, () => loadLandings()).subscribe()
    const activitySub = supabase.channel('activity-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'activity_log' }, () => loadLogs()).subscribe()
    return () => { supabase.removeChannel(landingSub); supabase.removeChannel(activitySub) }
  }, [user])

  const handleLogin = (userData) => { setUser(userData); sessionStorage.setItem('moxy_user', JSON.stringify(userData)) }
  const handleLogout = () => { setUser(null); sessionStorage.removeItem('moxy_user') }

  if (!user) return <LoginScreen onLogin={handleLogin} />

  return (
    <div style={{ minHeight: '100vh', background: BRAND.bg, color: BRAND.text, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Header user={user} landings={landings} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      {activeTab === 'Diagram' && <DiagramView landings={landings} setLandings={setLandings} user={user} drawingUrl={drawingUrl} setDrawingUrl={setDrawingUrl} />}
      {activeTab === 'Table' && <TableView landings={landings} user={user} onUpdate={loadLandings} />}
      {activeTab === 'Activity' && <ActivityView logs={logs} />}
      {activeTab === 'PDF' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => window.print()} style={{ padding: '14px 28px', background: BRAND.primary, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Print / Save as PDF</button>
        </div>
      )}
    </div>
  )
}
