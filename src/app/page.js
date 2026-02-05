'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const USERS = [
  { name: 'Shane', company: 'City Scaffold', role: 'shore' },
  { name: 'Steve', company: 'City Scaffold', role: 'shore' },
  { name: 'Jun', company: 'CMP Construction', role: 'pour' },
  { name: 'Brandon', company: 'CMP Construction', role: 'pour' },
  { name: 'Toetuu', company: 'Dominion Constructors', role: 'pour' },
  { name: 'Yusop', company: 'Nauhria', role: 'steel' },
  { name: 'James', company: 'Nauhria', role: 'steel' },
  { name: 'Arlo', company: 'Nauhria', role: 'steel' },
]

const STATUS_COLORS = {
  none: { bg: '#EF4444', border: '#DC2626', text: '#fff', label: 'Not Started' },
  shored: { bg: '#4A9AB5', border: '#2D6E7E', text: '#fff', label: 'Shore Loading Done' },
  steel: { bg: '#EAB308', border: '#CA8A04', text: '#000', label: 'Steel Fixing Done' },
  poured: { bg: '#22C55E', border: '#16A34A', text: '#fff', label: 'Concrete Poured' },
}

const STATUS_ORDER = ['none', 'shored', 'steel', 'poured']

function getStatus(l) {
  if (l.pour_complete) return 'poured'
  if (l.steel_complete) return 'steel'
  if (l.shore_complete) return 'shored'
  return 'none'
}

function getDeviceInfo() {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS'
  if (/Android/.test(ua)) return 'Android'
  if (/Windows/.test(ua)) return 'Windows'
  if (/Mac/.test(ua)) return 'Mac'
  return 'Unknown'
}

export default function Home() {
  const [user, setUser] = useState(null)
  const [landings, setLandings] = useState([])
  const [activities, setActivities] = useState([])
  const [selected, setSelected] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [bgImage, setBgImage] = useState(null)
  const [view, setView] = useState('diagram')
  const [zoom, setZoom] = useState(0.7)
  const [loading, setLoading] = useState(true)
  const [activityFilter, setActivityFilter] = useState('all')
  const containerRef = useRef(null)
  const [clientIp, setClientIp] = useState('unknown')

  // Get IP
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => setClientIp(d.ip))
      .catch(() => setClientIp('unknown'))
  }, [])

  // Check saved user
  useEffect(() => {
    const saved = localStorage.getItem('moxy-user')
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch(e) {}
    }
  }, [])

  // Load data
  useEffect(() => {
    if (!user) return
    loadLandings()
    loadActivities()
    loadBgImage()

    const landingSub = supabase
      .channel('landings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'landings' }, () => loadLandings())
      .subscribe()

    const actSub = supabase
      .channel('activities')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_log' }, () => loadActivities())
      .subscribe()

    return () => {
      supabase.removeChannel(landingSub)
      supabase.removeChannel(actSub)
    }
  }, [user])

  async function loadLandings() {
    const { data } = await supabase.from('landings').select('*').order('number')
    if (data) setLandings(data)
    setLoading(false)
  }

  async function loadActivities() {
    const { data } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(200)
    if (data) setActivities(data)
  }

  async function loadBgImage() {
    const { data } = await supabase.from('settings').select('*').eq('key', 'bg_image').single()
    if (data?.value) setBgImage(data.value)
  }

  async function logActivity(action, details) {
    await supabase.from('activity_log').insert({
      user_name: user.name,
      company: user.company,
      action,
      details,
      ip_address: clientIp,
      device_info: getDeviceInfo(),
      user_agent: navigator.userAgent,
    })
  }

  async function updateLanding(id, updates, actionDesc) {
    const { error } = await supabase.from('landings').update(updates).eq('id', id)
    if (!error && actionDesc) await logActivity(actionDesc.action, actionDesc.details)
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      setBgImage(dataUrl)
      await supabase.from('settings').upsert({ key: 'bg_image', value: dataUrl })
      await logActivity('upload_drawing', 'Uploaded new stairwell drawing')
    }
    reader.readAsDataURL(file)
  }

  function selectUser(u) {
    setUser(u)
    localStorage.setItem('moxy-user', JSON.stringify(u))
    logActivity('login', `${u.name} (${u.company}) logged in`)
  }

  function logout() {
    logActivity('logout', `${user.name} (${user.company}) logged out`)
    localStorage.removeItem('moxy-user')
    setUser(null)
  }

  // Shore loading toggle
  async function toggleShore(landing) {
    const newVal = !landing.shore_complete
    const dateVal = newVal ? new Date().toISOString().split('T')[0] : null
    await updateLanding(landing.id, {
      shore_complete: newVal,
      shore_date: dateVal,
      shore_by: newVal ? `${user.name} (${user.company})` : null,
    }, {
      action: newVal ? 'shore_complete' : 'shore_undo',
      details: `Landing ${landing.number}: Shore loading ${newVal ? 'completed' : 'unchecked'}`,
    })
  }

  // Steel fixing toggle
  async function toggleSteel(landing) {
    const newVal = !landing.steel_complete
    const dateVal = newVal ? new Date().toISOString().split('T')[0] : null
    await updateLanding(landing.id, {
      steel_complete: newVal,
      steel_date: dateVal,
      steel_by: newVal ? `${user.name} (${user.company})` : null,
    }, {
      action: newVal ? 'steel_complete' : 'steel_undo',
      details: `Landing ${landing.number}: Steel fixing ${newVal ? 'completed' : 'unchecked'}`,
    })
  }

  // Concrete pour toggle
  async function togglePour(landing) {
    const newVal = !landing.pour_complete
    const dateVal = newVal ? new Date().toISOString().split('T')[0] : null
    await updateLanding(landing.id, {
      pour_complete: newVal,
      pour_date: dateVal,
      pour_by: newVal ? `${user.name} (${user.company})` : null,
    }, {
      action: newVal ? 'pour_complete' : 'pour_undo',
      details: `Landing ${landing.number}: Concrete pour ${newVal ? 'completed' : 'unchecked'}`,
    })
  }

  // Update number
  async function updateNumber(landing, newNumber) {
    const oldNumber = landing.number
    await updateLanding(landing.id, { number: newNumber }, {
      action: 'renumber',
      details: `Landing renumbered from ${oldNumber} to ${newNumber}`,
    })
  }

  // Update notes
  async function updateNotes(landing, notes) {
    await updateLanding(landing.id, { notes }, {
      action: 'note_edit',
      details: `Landing ${landing.number}: Notes updated`,
    })
  }

  // Update date fields
  async function updateShoreDate(landing, date) {
    await updateLanding(landing.id, { shore_date: date }, {
      action: 'date_edit',
      details: `Landing ${landing.number}: Shore date changed to ${date}`,
    })
  }

  async function updateSteelDate(landing, date) {
    await updateLanding(landing.id, { steel_date: date }, {
      action: 'date_edit',
      details: `Landing ${landing.number}: Steel date changed to ${date}`,
    })
  }

  async function updatePourDate(landing, date) {
    await updateLanding(landing.id, { pour_date: date }, {
      action: 'date_edit',
      details: `Landing ${landing.number}: Pour date changed to ${date}`,
    })
  }

  // Position update (drag)
  async function updatePosition(id, x, y) {
    await supabase.from('landings').update({ pos_x: x, pos_y: y }).eq('id', id)
  }

  // Drag handlers - positions stored as percentages of image size
  function handleMouseDown(e, id) {
    e.stopPropagation()
    const landing = landings.find(l => l.id === id)
    if (!landing || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setDragging(id)
    setDragOffset({
      x: ((e.clientX - rect.left) / rect.width) * 100 - landing.pos_x,
      y: ((e.clientY - rect.top) / rect.height) * 100 - landing.pos_y,
    })
  }

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.x))
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.y))
    setLandings(prev => prev.map(l => l.id === dragging ? { ...l, pos_x: x, pos_y: y } : l))
  }, [dragging, dragOffset])

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      const l = landings.find(l => l.id === dragging)
      if (l) updatePosition(l.id, l.pos_x, l.pos_y)
    }
    setDragging(null)
  }, [dragging, landings])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  // Touch handlers
  function handleTouchStart(e, id) {
    e.stopPropagation()
    const landing = landings.find(l => l.id === id)
    if (!landing || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    setDragging(id)
    setDragOffset({
      x: ((touch.clientX - rect.left) / rect.width) * 100 - landing.pos_x,
      y: ((touch.clientY - rect.top) / rect.height) * 100 - landing.pos_y,
    })
  }

  const handleTouchMove = useCallback((e) => {
    if (!dragging || !containerRef.current) return
    e.preventDefault()
    const rect = containerRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100 - dragOffset.x))
    const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100 - dragOffset.y))
    setLandings(prev => prev.map(l => l.id === dragging ? { ...l, pos_x: x, pos_y: y } : l))
  }, [dragging, dragOffset])

  const handleTouchEnd = useCallback(() => {
    if (dragging) {
      const l = landings.find(l => l.id === dragging)
      if (l) updatePosition(l.id, l.pos_x, l.pos_y)
    }
    setDragging(null)
  }, [dragging, landings])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false })
      window.addEventListener('touchend', handleTouchEnd)
      return () => {
        window.removeEventListener('touchmove', handleTouchMove)
        window.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [dragging, handleTouchMove, handleTouchEnd])

  // Export CSV
  function exportActivityCSV() {
    const filtered = activityFilter === 'all' ? activities : activities.filter(a => a.company === activityFilter)
    const csv = [
      'Timestamp,User,Company,Action,Details,IP Address,Device',
      ...filtered.map(a =>
        `"${new Date(a.created_at).toLocaleString('en-NZ')}","${a.user_name}","${a.company}","${a.action}","${a.details}","${a.ip_address}","${a.device_info}"`
      )
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `moxy-activity-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Stats
  const shoreCount = landings.filter(l => l.shore_complete).length
  const steelCount = landings.filter(l => l.steel_complete).length
  const pourCount = landings.filter(l => l.pour_complete).length

  // Login screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F172A' }}>
        <div className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: '#4A9AB5' }}>
              <span className="text-2xl font-black" style={{ color: '#0F172A' }}>CS</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Moxy Hotel</h1>
            <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Stair Landing Tracker</p>
          </div>
          <div className="space-y-2">
            {USERS.map((u, i) => (
              <button
                key={i}
                onClick={() => selectUser(u)}
                className="w-full p-4 rounded-lg text-left transition-all hover:scale-[1.02]"
                style={{
                  background: '#1E293B',
                  border: '1px solid #334155',
                }}
              >
                <div className="font-bold text-white">{u.name}</div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>{u.company}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const selectedLanding = landings.find(l => l.id === selected)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0F172A' }}>
      {/* Header */}
      <div className="no-print flex items-center justify-between px-4 py-3 flex-wrap gap-2" style={{ background: '#1E293B', borderBottom: '2px solid #334155' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black" style={{ background: '#4A9AB5', color: '#0F172A' }}>CS</div>
          <div>
            <div className="font-bold text-sm text-white">Moxy Hotel — Stair Landing Tracker</div>
            <div className="text-xs" style={{ color: '#94A3B8' }}>Logged in: {user.name} ({user.company})</div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-xs">
          <div className="text-center">
            <div className="font-bold text-lg" style={{ color: '#EF4444' }}>{landings.length - shoreCount}</div>
            <div style={{ color: '#94A3B8' }}>Not Started</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg" style={{ color: '#4A9AB5' }}>{shoreCount - steelCount}</div>
            <div style={{ color: '#94A3B8' }}>Shored</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg" style={{ color: '#EAB308' }}>{steelCount - pourCount}</div>
            <div style={{ color: '#94A3B8' }}>Steel</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg" style={{ color: '#22C55E' }}>{pourCount}</div>
            <div style={{ color: '#94A3B8' }}>Poured</div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex gap-1.5">
          {['diagram', 'table', 'activity'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={{
                border: `1px solid ${view === v ? '#4A9AB5' : '#475569'}`,
                background: view === v ? '#4A9AB5' : 'transparent',
                color: view === v ? '#0F172A' : '#E2E8F0',
              }}>
              {v === 'diagram' ? '📐 Diagram' : v === 'table' ? '📋 Table' : '📊 Activity'}
            </button>
          ))}
          <button onClick={() => window.print()} className="px-3 py-1.5 rounded-md text-xs font-semibold" style={{ border: '1px solid #475569', color: '#E2E8F0' }}>📄 PDF</button>
          <button onClick={logout} className="px-3 py-1.5 rounded-md text-xs font-semibold" style={{ border: '1px solid #EF4444', color: '#EF4444' }}>Logout</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {view === 'diagram' && (
          <div className="flex-1 flex">
            <div className="flex-1 flex flex-col">
              {/* Toolbar */}
              <div className="no-print flex items-center gap-2 px-4 py-2 flex-wrap" style={{ background: '#1E293B', borderBottom: '1px solid #334155' }}>
                <label className="px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer" style={{ background: '#334155', border: '1px solid #475569', color: '#E2E8F0' }}>
                  📷 Upload Drawing
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <div className="flex items-center gap-1">
                  <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="w-7 h-7 rounded-md text-sm" style={{ border: '1px solid #475569', color: '#E2E8F0', background: 'transparent' }}>−</button>
                  <span className="text-xs w-10 text-center" style={{ color: '#94A3B8' }}>{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="w-7 h-7 rounded-md text-sm" style={{ border: '1px solid #475569', color: '#E2E8F0', background: 'transparent' }}>+</button>
                </div>
              </div>

              {/* Canvas */}
              <div className="flex-1 overflow-auto" style={{ background: '#0F172A' }}>
                <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', cursor: dragging ? 'grabbing' : 'default', transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                  {bgImage && <img src={bgImage} alt="Drawing" style={{ display: 'block', pointerEvents: 'none', opacity: 0.85, maxWidth: 'none' }} />}
                  {!bgImage && (
                    <div style={{ width: '1400px', height: '1000px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '14px', textAlign: 'center', padding: '40px' }}>
                      Upload your stairwell drawing using the button above
                    </div>
                  )}
                  {landings.map(l => {
                    const status = getStatus(l)
                    const colors = STATUS_COLORS[status]
                    const isSel = selected === l.id
                    return (
                      <div key={l.id}
                        onMouseDown={e => handleMouseDown(e, l.id)}
                        onTouchStart={e => handleTouchStart(e, l.id)}
                        onClick={e => { e.stopPropagation(); setSelected(isSel ? null : l.id) }}
                        style={{
                          position: 'absolute',
                          left: `${l.pos_x}%`,
                          top: `${l.pos_y}%`,
                          transform: 'translate(-50%, -50%)',
                          width: `${36 / zoom}px`, height: `${36 / zoom}px`, borderRadius: '50%',
                          background: colors.bg, border: `${3 / zoom}px solid ${isSel ? '#fff' : colors.border}`,
                          boxShadow: isSel ? '0 0 0 3px rgba(255,255,255,0.4), 0 4px 12px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.4)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: dragging === l.id ? 'grabbing' : 'grab', userSelect: 'none',
                          zIndex: dragging === l.id ? 1000 : isSel ? 100 : 10,
                          fontSize: `${13 / zoom}px`, fontWeight: '800', color: colors.text,
                          transition: dragging === l.id ? 'none' : 'box-shadow 0.15s',
                        }}
                        title={`Landing ${l.number} — ${colors.label}`}
                      >{l.number}</div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <div className="w-72 flex-shrink-0 overflow-auto" style={{ background: '#1E293B', borderLeft: '2px solid #334155' }}>
              {selectedLanding ? (
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-base"
                      style={{ background: STATUS_COLORS[getStatus(selectedLanding)].bg, border: `3px solid ${STATUS_COLORS[getStatus(selectedLanding)].border}`, color: STATUS_COLORS[getStatus(selectedLanding)].text }}>
                      {selectedLanding.number}
                    </div>
                  </div>

                  {/* Number */}
                  <div className="mb-3">
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#94A3B8' }}>Landing Number</label>
                    <input type="number" value={selectedLanding.number}
                      onChange={e => updateNumber(selectedLanding, parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-md text-sm font-bold" style={{ background: '#0F172A', border: '1px solid #475569', color: '#E2E8F0' }} />
                  </div>

                  <div className="h-px my-4" style={{ background: '#334155' }} />

                  {/* Shore Loading */}
                  <div className="rounded-lg p-3 mb-3" style={{ background: selectedLanding.shore_complete ? 'rgba(74,154,181,0.15)' : 'rgba(239,68,68,0.1)', border: `1px solid ${selectedLanding.shore_complete ? '#4A9AB5' : '#475569'}` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div onClick={() => toggleShore(selectedLanding)} className="w-5 h-5 rounded flex items-center justify-center text-xs cursor-pointer flex-shrink-0"
                        style={{ border: `2px solid ${selectedLanding.shore_complete ? '#4A9AB5' : '#64748B'}`, background: selectedLanding.shore_complete ? '#4A9AB5' : 'transparent', color: '#fff' }}>
                        {selectedLanding.shore_complete && '✓'}
                      </div>
                      <span className="font-bold text-xs" style={{ color: '#4A9AB5' }}>Shore Loading</span>
                    </div>
                    <input type="date" value={selectedLanding.shore_date || ''} onChange={e => updateShoreDate(selectedLanding, e.target.value)}
                      className="w-full px-2 py-1 rounded text-xs" style={{ background: '#0F172A', border: '1px solid #475569', color: '#E2E8F0' }} />
                    {selectedLanding.shore_by && <div className="text-xs mt-1" style={{ color: '#64748B' }}>By: {selectedLanding.shore_by}</div>}
                  </div>

                  {/* Steel Fixing */}
                  <div className="rounded-lg p-3 mb-3" style={{ background: selectedLanding.steel_complete ? 'rgba(234,179,8,0.15)' : 'rgba(100,116,139,0.1)', border: `1px solid ${selectedLanding.steel_complete ? '#EAB308' : '#475569'}` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div onClick={() => toggleSteel(selectedLanding)} className="w-5 h-5 rounded flex items-center justify-center text-xs cursor-pointer flex-shrink-0"
                        style={{ border: `2px solid ${selectedLanding.steel_complete ? '#EAB308' : '#64748B'}`, background: selectedLanding.steel_complete ? '#EAB308' : 'transparent', color: '#000' }}>
                        {selectedLanding.steel_complete && '✓'}
                      </div>
                      <span className="font-bold text-xs" style={{ color: '#EAB308' }}>Steel Fixing (Nauhria)</span>
                    </div>
                    <input type="date" value={selectedLanding.steel_date || ''} onChange={e => updateSteelDate(selectedLanding, e.target.value)}
                      className="w-full px-2 py-1 rounded text-xs" style={{ background: '#0F172A', border: '1px solid #475569', color: '#E2E8F0' }} />
                    {selectedLanding.steel_by && <div className="text-xs mt-1" style={{ color: '#64748B' }}>By: {selectedLanding.steel_by}</div>}
                  </div>

                  {/* Concrete Pour */}
                  <div className="rounded-lg p-3 mb-3" style={{ background: selectedLanding.pour_complete ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.1)', border: `1px solid ${selectedLanding.pour_complete ? '#22C55E' : '#475569'}` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div onClick={() => togglePour(selectedLanding)} className="w-5 h-5 rounded flex items-center justify-center text-xs cursor-pointer flex-shrink-0"
                        style={{ border: `2px solid ${selectedLanding.pour_complete ? '#22C55E' : '#64748B'}`, background: selectedLanding.pour_complete ? '#22C55E' : 'transparent', color: '#fff' }}>
                        {selectedLanding.pour_complete && '✓'}
                      </div>
                      <span className="font-bold text-xs" style={{ color: '#22C55E' }}>Concrete Poured</span>
                    </div>
                    <input type="date" value={selectedLanding.pour_date || ''} onChange={e => updatePourDate(selectedLanding, e.target.value)}
                      className="w-full px-2 py-1 rounded text-xs" style={{ background: '#0F172A', border: '1px solid #475569', color: '#E2E8F0' }} />
                    {selectedLanding.pour_by && <div className="text-xs mt-1" style={{ color: '#64748B' }}>By: {selectedLanding.pour_by}</div>}
                  </div>

                  {/* Notes */}
                  <div className="mb-3">
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#94A3B8' }}>Notes</label>
                    <textarea value={selectedLanding.notes || ''} onChange={e => updateNotes(selectedLanding, e.target.value)} rows={3}
                      className="w-full px-3 py-2 rounded-md text-xs resize-y" style={{ background: '#0F172A', border: '1px solid #475569', color: '#E2E8F0', fontFamily: 'inherit' }} />
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center text-xs" style={{ color: '#64748B' }}>
                  <div className="text-3xl mb-3">👆</div>
                  Click a landing marker to edit
                </div>
              )}

              {/* Legend */}
              <div className="p-3 text-xs" style={{ borderTop: '1px solid #334155' }}>
                <div className="font-bold mb-2" style={{ color: '#94A3B8' }}>LEGEND</div>
                {Object.entries(STATUS_COLORS).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 mb-1">
                    <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: v.bg, border: `2px solid ${v.border}` }} />
                    <span style={{ color: '#CBD5E1' }}>{v.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'table' && (
          <div className="flex-1 overflow-auto p-4">
            <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Shore Loading', 'Shore Date', 'Shore By', 'Steel Fixing', 'Steel Date', 'Steel By', 'Concrete Pour', 'Pour Date', 'Pour By', 'Notes'].map(h => (
                    <th key={h} className="px-2 py-2.5 text-left font-bold text-xs uppercase tracking-wide sticky top-0" style={{ background: '#334155', color: '#E2E8F0', borderBottom: '2px solid #475569' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...landings].sort((a, b) => a.number - b.number).map(l => {
                  const status = getStatus(l)
                  return (
                    <tr key={l.id} className="cursor-pointer" style={{ borderBottom: '1px solid #1E293B', background: selected === l.id ? 'rgba(74,154,181,0.1)' : 'transparent' }}
                      onClick={() => setSelected(l.id === selected ? null : l.id)}>
                      <td className="px-2 py-2 text-center">
                        <div className="w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-black" style={{ background: STATUS_COLORS[status].bg, color: STATUS_COLORS[status].text }}>{l.number}</div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <div onClick={e => { e.stopPropagation(); toggleShore(l) }} className="w-5 h-5 rounded inline-flex items-center justify-center text-xs cursor-pointer"
                          style={{ border: `2px solid ${l.shore_complete ? '#4A9AB5' : '#64748B'}`, background: l.shore_complete ? '#4A9AB5' : 'transparent', color: '#fff' }}>
                          {l.shore_complete && '✓'}
                        </div>
                      </td>
                      <td className="px-2 py-2">{l.shore_date || '-'}</td>
                      <td className="px-2 py-2" style={{ color: '#94A3B8' }}>{l.shore_by || '-'}</td>
                      <td className="px-2 py-2 text-center">
                        <div onClick={e => { e.stopPropagation(); toggleSteel(l) }} className="w-5 h-5 rounded inline-flex items-center justify-center text-xs cursor-pointer"
                          style={{ border: `2px solid ${l.steel_complete ? '#EAB308' : '#64748B'}`, background: l.steel_complete ? '#EAB308' : 'transparent', color: '#000' }}>
                          {l.steel_complete && '✓'}
                        </div>
                      </td>
                      <td className="px-2 py-2">{l.steel_date || '-'}</td>
                      <td className="px-2 py-2" style={{ color: '#94A3B8' }}>{l.steel_by || '-'}</td>
                      <td className="px-2 py-2 text-center">
                        <div onClick={e => { e.stopPropagation(); togglePour(l) }} className="w-5 h-5 rounded inline-flex items-center justify-center text-xs cursor-pointer"
                          style={{ border: `2px solid ${l.pour_complete ? '#22C55E' : '#64748B'}`, background: l.pour_complete ? '#22C55E' : 'transparent', color: '#fff' }}>
                          {l.pour_complete && '✓'}
                        </div>
                      </td>
                      <td className="px-2 py-2">{l.pour_date || '-'}</td>
                      <td className="px-2 py-2" style={{ color: '#94A3B8' }}>{l.pour_by || '-'}</td>
                      <td className="px-2 py-2" style={{ color: '#94A3B8' }}>{l.notes || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {view === 'activity' && (
          <div className="flex-1 overflow-auto p-4">
            <div className="flex items-center gap-3 mb-4 no-print">
              <select value={activityFilter} onChange={e => setActivityFilter(e.target.value)}
                className="px-3 py-2 rounded-md text-xs" style={{ background: '#1E293B', border: '1px solid #475569', color: '#E2E8F0' }}>
                <option value="all">All Companies</option>
                <option value="City Scaffold">City Scaffold</option>
                <option value="CMP Construction">CMP Construction</option>
                <option value="Dominion Constructors">Dominion Constructors</option>
                <option value="Nauhria">Nauhria</option>
              </select>
              <button onClick={exportActivityCSV} className="px-3 py-2 rounded-md text-xs font-semibold" style={{ background: '#4A9AB5', color: '#0F172A' }}>
                📥 Export CSV
              </button>
            </div>

            <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Timestamp', 'User', 'Company', 'Action', 'Details', 'IP Address', 'Device'].map(h => (
                    <th key={h} className="px-2 py-2.5 text-left font-bold text-xs uppercase tracking-wide sticky top-0" style={{ background: '#334155', color: '#E2E8F0', borderBottom: '2px solid #475569' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(activityFilter === 'all' ? activities : activities.filter(a => a.company === activityFilter)).map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #1E293B' }}>
                    <td className="px-2 py-2 whitespace-nowrap">{new Date(a.created_at).toLocaleString('en-NZ')}</td>
                    <td className="px-2 py-2 font-semibold">{a.user_name}</td>
                    <td className="px-2 py-2" style={{ color: '#94A3B8' }}>{a.company}</td>
                    <td className="px-2 py-2">
                      <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{
                        background: a.action.includes('shore') ? 'rgba(74,154,181,0.2)' : a.action.includes('steel') ? 'rgba(234,179,8,0.2)' : a.action.includes('pour') ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.2)',
                        color: a.action.includes('shore') ? '#4A9AB5' : a.action.includes('steel') ? '#EAB308' : a.action.includes('pour') ? '#22C55E' : '#94A3B8',
                      }}>{a.action}</span>
                    </td>
                    <td className="px-2 py-2">{a.details}</td>
                    <td className="px-2 py-2" style={{ color: '#64748B' }}>{a.ip_address}</td>
                    <td className="px-2 py-2" style={{ color: '#64748B' }}>{a.device_info}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
