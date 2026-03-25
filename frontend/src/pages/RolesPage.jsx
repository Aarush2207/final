import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Award, AlertTriangle, Play, BookOpen } from 'lucide-react';
import { getRoles, createRole, deleteRole, rankEmployees, getSkillGap } from '../api';
import { SkillBadge, ScoreCircle, CourseCard, Spinner } from '../components';
import toast from 'react-hot-toast';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);

  // New role form
  const [newRoleName, setNewRoleName] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [newRoleSkills, setNewRoleSkills] = useState([]);
  const [addingRole, setAddingRole] = useState(false);

  // Ranking & Skill Gap
  const [ranking, setRanking] = useState(null);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [skillGap, setSkillGap] = useState(null);
  const [gapLoading, setGapLoading] = useState(false);

  const load = async () => {
    try { setRoles(await getRoles()); } catch { toast.error('Failed to load roles'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim() || newRoleSkills.length === 0) return toast.error('Name and at least 1 skill required');
    setAddingRole(true);
    try {
      await createRole({ name: newRoleName, required_skills: newRoleSkills });
      toast.success('Role created');
      setNewRoleName(''); setNewRoleSkills([]);
      load();
    } catch { toast.error('Failed to create role'); }
    finally { setAddingRole(false); }
  };

  const handleDeleteRole = async (id, name) => {
    if (!window.confirm(`Delete role ${name}?`)) return;
    try {
      await deleteRole(id);
      setRoles(roles.filter(r => r.id !== id));
      if (selectedRole?.id === id) { setSelectedRole(null); setRanking(null); }
      toast.success('Role deleted');
    } catch { toast.error('Failed to delete role'); }
  };

  const handleRank = async (role) => {
    setSelectedRole(role);
    setRankingLoading(true);
    setSkillGap(null); setSelectedEmployeeId(null);
    try {
      setRanking(await rankEmployees(role.id, 5));
    } catch { toast.error('Failed to rank employees'); }
    finally { setRankingLoading(false); }
  };

  const handleFetchGap = async (empId) => {
    if (selectedEmployeeId === empId) { setSelectedEmployeeId(null); setSkillGap(null); return; }
    setSelectedEmployeeId(empId);
    setGapLoading(true);
    try {
      setSkillGap(await getSkillGap(selectedRole.id, empId));
    } catch { toast.error('Failed to fetch skill gap'); }
    finally { setGapLoading(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}><Spinner size={40} /></div>;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>Role Management</h1>
        <p style={{ fontSize: 14, color: '#64748b' }}>Define roles, filter best candidates, and analyze skill gaps.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 24 }}>
        {/* Left Column: Roles list & creation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Create Role Form */}
          <form className="glass" style={{ padding: 20, borderRadius: 16 }} onSubmit={handleAddRole}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Create New Role</h2>
            <div style={{ marginBottom: 12 }}>
              <input className="input-field" placeholder="Role Name (e.g. Frontend Dev)"
                value={newRoleName} onChange={e => setNewRoleName(e.target.value)} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input className="input-field" placeholder="Add Required Skill" value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (skillInput.trim() && !newRoleSkills.includes(skillInput.trim())) {
                        setNewRoleSkills([...newRoleSkills, skillInput.trim()]);
                        setSkillInput('');
                      }
                    }
                  }} />
                <button type="button" className="btn-secondary" onClick={() => {
                  if (skillInput.trim() && !newRoleSkills.includes(skillInput.trim())) {
                    setNewRoleSkills([...newRoleSkills, skillInput.trim()]);
                    setSkillInput('');
                  }
                }}><Plus size={16} /></button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {newRoleSkills.map(s => (
                  <span key={s} className="skill-badge" style={{ cursor: 'pointer' }} onClick={() => setNewRoleSkills(xs => xs.filter(x => x !== s))}>
                    {s} &times;
                  </span>
                ))}
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={addingRole}>
              {addingRole ? <Spinner size={16} /> : 'Save Role'}
            </button>
          </form>

          {/* Roles List */}
          <div className="glass" style={{ padding: 20, borderRadius: 16, flex: 1 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Defined Roles</h2>
            {roles.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13, padding: '20px 0' }}>No roles defined yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {roles.map(r => (
                  <div key={r.id} style={{
                    padding: 14, borderRadius: 10, border: '1px solid',
                    background: selectedRole?.id === r.id ? 'rgba(99,102,241,0.1)' : 'rgba(30,34,53,0.6)',
                    borderColor: selectedRole?.id === r.id ? '#6366f1' : 'var(--border)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }} onClick={() => handleRank(r)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{r.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteRole(r.id, r.name); }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {r.required_skills?.map(s => <SkillBadge key={s} skill={s} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ranking & Gap Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {rankingLoading ? (
            <div className="glass" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, borderRadius: 16 }}>
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <Spinner size={32} />
                <div style={{ marginTop: 12, fontSize: 14 }}>Matching employees algorithms...</div>
              </div>
            </div>
          ) : !ranking ? (
            <div className="glass" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, borderRadius: 16 }}>
              <div style={{ textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Smart Matching</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Select a role on the left to find the best candidates.</div>
              </div>
            </div>
          ) : (
            <>
              {/* Top Matches */}
              <div className="glass" style={{ padding: 24, borderRadius: 16, animation: 'slideIn 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Award color="#f59e0b" /> Top Matches for {ranking.role.name}
                  </h2>
                  <span style={{ fontSize: 13, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: 20 }}>
                    {ranking.topEmployees.length} recommended
                  </span>
                </div>

                {ranking.topEmployees.length === 0 ? (
                  <div style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: '30px 0' }}>No employees found matching this role's skills.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {ranking.topEmployees.map((emp, i) => (
                      <div key={emp.id} style={{
                        display: 'flex', alignItems: 'center', gap: 16, padding: 16,
                        background: i === 0 ? 'rgba(99,102,241,0.08)' : 'rgba(30,34,53,0.6)',
                        border: `1px solid ${i === 0 ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                        borderRadius: 12,
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', background: i === 0 ? '#f59e0b' : '#64748b',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800,
                        }}>
                          #{i+1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
                            {emp.name} <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>({emp.experience}y exp)</span>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: '#10b981' }}>✓ Match:</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                              {emp.matchedSkills.length > 0
                                ? emp.matchedSkills.map(s => <span key={s} className="skill-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', borderColor: 'rgba(16,185,129,0.2)' }}>{s}</span>)
                                : <span style={{ fontSize: 12, color: '#64748b' }}>None</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 24, fontWeight: 800, color: i === 0 ? '#6366f1' : '#f1f5f9' }}>{emp.compositeScore}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>Composite Score</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Other Employees & Skill Gaps */}
              {ranking.otherEmployees.length > 0 && (
                <div className="glass" style={{ padding: 24, borderRadius: 16, animation: 'slideIn 0.3s ease', animationDelay: '0.1s', animationFillMode: 'both' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>Needs Training ({ranking.otherEmployees.length})</h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {ranking.otherEmployees.map(emp => (
                      <div key={emp.id} style={{
                        background: 'rgba(30,34,53,0.6)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
                      }}>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px',
                          cursor: 'pointer', background: selectedEmployeeId === emp.id ? 'rgba(45,49,71,0.5)' : 'transparent',
                        }} onClick={() => handleFetchGap(emp.id)}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{emp.name}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Score: {emp.compositeScore} • Missing {emp.missingSkills.length} required skills</div>
                          </div>
                          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertTriangle size={14} color="#f59e0b" /> Analyze Gap
                          </button>
                        </div>

                        {/* Gap Analysis Dropdown */}
                        {selectedEmployeeId === emp.id && (
                          <div style={{ padding: 20, borderTop: '1px solid var(--border)', background: 'rgba(15,17,23,0.4)' }}>
                            {gapLoading ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: 13 }}><Spinner size={16} /> Computing skill gaps...</div>
                            ) : skillGap ? (
                              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                                  <div style={{ flex: 1, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: 12, borderRadius: 10 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 8 }}>❌ Missing Skills</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                      {skillGap.missingSkills.length > 0 ? skillGap.missingSkills.map(s => (
                                        <span key={s} className="skill-badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>{s}</span>
                                      )) : <span style={{ fontSize: 12, color: '#94a3b8' }}>None</span>}
                                    </div>
                                  </div>
                                  <div style={{ flex: 1, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: 12, borderRadius: 10 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b', marginBottom: 8 }}>⚠️ Weak Skills (Rating &lt; 3)</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                      {skillGap.weakSkills.length > 0 ? skillGap.weakSkills.map(s => (
                                        <span key={s} className="skill-badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}>{s}</span>
                                      )) : <span style={{ fontSize: 12, color: '#94a3b8' }}>None</span>}
                                    </div>
                                  </div>
                                </div>

                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <BookOpen size={16} color="#6366f1" /> Course Suggestions
                                </h3>
                                {Object.keys(skillGap.suggestions).length === 0 ? (
                                  <div style={{ fontSize: 13, color: '#94a3b8' }}>No suggestions needed.</div>
                                ) : (
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                                    {Object.entries(skillGap.suggestions).map(([skill, courses]) => (
                                      <CourseCard key={skill} skill={skill} courses={courses} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
