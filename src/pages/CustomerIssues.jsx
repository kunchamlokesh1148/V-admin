import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Mail, Phone, Calendar, Clock, X, CheckSquare, MessageSquare } from 'lucide-react';

export const CustomerIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Details Modal state
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_issues')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (err) {
      console.error('Error loading customer issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (issueId, newStatus) => {
    try {
      const { error } = await supabase
        .from('customer_issues')
        .update({ status: newStatus })
        .eq('id', issueId);

      if (error) throw error;
      setIssues(prev => prev.map(issue => issue.id === issueId ? { ...issue, status: newStatus } : issue));
      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert('Error updating issue status: ' + err.message);
    }
  };

  const handleOpenDetails = (issue) => {
    setSelectedIssue(issue);
    setModalOpen(true);
  };

  const pendingCount = issues.filter(i => i.status === 'Pending').length;
  const progressCount = issues.filter(i => i.status === 'In Progress').length;
  const resolvedCount = issues.filter(i => i.status === 'Resolved').length;

  const filteredIssues = issues.filter((issue) => {
    const custName = issue.profiles?.full_name || '';
    const company = issue.profiles?.company_name || '';
    return custName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.issue_type.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Metrics Cards */}
      <div className="grid grid-3" style={{ gap: '24px' }}>
        <div className="card text-center" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>PENDING</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '6px', color: 'var(--warning)' }}>{pendingCount}</div>
        </div>
        <div className="card text-center" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>IN PROGRESS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '6px', color: 'var(--info)' }}>{progressCount}</div>
        </div>
        <div className="card text-center" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>RESOLVED</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '6px', color: 'var(--success)' }}>{resolvedCount}</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '0 1 400px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Filter by customer, shop, issue type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>
      </div>

      {/* Issues Table */}
      <section className="table-card">
        <div className="table-responsive">
          {loading ? (
            <div className="skeleton" style={{ height: '300px' }}></div>
          ) : filteredIssues.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <MessageSquare size={36} style={{ margin: '0 auto 12px auto', color: 'var(--text-muted)' }} />
              No customer issues recorded.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer & Store</th>
                  <th>Issue Details</th>
                  <th>Contacts</th>
                  <th>Raised Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((issue) => {
                  const companyName = issue.profiles?.company_name || 'Retail Partner';
                  const customerName = issue.profiles?.full_name || 'B2B Client';
                  const dateStr = new Date(issue.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

                  return (
                    <tr key={issue.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '700' }}>{companyName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{customerName}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>{issue.issue_type}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {issue.description}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                            <Mail size={12} /> {issue.profiles?.email || 'No email'}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                            <Phone size={12} /> {issue.profiles?.phone || issue.profiles?.mobile_number || 'No mobile'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <Calendar size={12} />
                          {dateStr}
                        </span>
                      </td>
                      <td>
                        <select
                          value={issue.status || 'Pending'}
                          onChange={(e) => handleUpdateStatus(issue.id, e.target.value)}
                          className="form-control"
                          style={{
                            height: '32px',
                            padding: '0 8px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            width: '130px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 
                              issue.status === 'Resolved' ? 'var(--success-light)' :
                              issue.status === 'In Progress' ? 'var(--info-light)' : 'var(--warning-light)',
                            color:
                              issue.status === 'Resolved' ? 'var(--success)' :
                              issue.status === 'In Progress' ? 'var(--info)' : 'var(--warning)',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="Pending" style={{ backgroundColor: '#fff', color: 'var(--text-main)' }}>Pending</option>
                          <option value="In Progress" style={{ backgroundColor: '#fff', color: 'var(--text-main)' }}>In Progress</option>
                          <option value="Resolved" style={{ backgroundColor: '#fff', color: 'var(--text-main)' }}>Resolved</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleOpenDetails(issue)} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                            View Details
                          </button>
                          {issue.status !== 'Resolved' && (
                            <button
                              onClick={() => handleUpdateStatus(issue.id, 'Resolved')}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '6px', borderRadius: '4px', backgroundColor: 'var(--success)', border: 'none' }}
                              title="Mark as Resolved"
                            >
                              <CheckSquare size={14} style={{ color: '#fff' }} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Details Modal */}
      {modalOpen && selectedIssue && (
        <div className="drawer-overlay" onClick={() => setModalOpen(false)}>
          <div className="drawer" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Support Issue Details</h3>
              <button onClick={() => setModalOpen(false)} className="btn btn-icon btn-secondary" style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Ticket Status</span>
                <div style={{ marginTop: '4px' }}>
                  <span className={`status-badge ${
                    selectedIssue.status === 'Resolved' ? 'completed' :
                    selectedIssue.status === 'In Progress' ? 'pending' : 'cancelled'
                  }`}>
                    {selectedIssue.status || 'Pending'}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Issue Type</span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '4px', color: 'var(--secondary)' }}>
                  {selectedIssue.issue_type}
                </h4>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Issue Description</span>
                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.5',
                  backgroundColor: 'var(--bg-main)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  marginTop: '6px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedIssue.description}
                </p>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)' }} />

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Client Reference</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', fontSize: '0.9rem' }}>
                  <div><strong>Company:</strong> {selectedIssue.profiles?.company_name || 'N/A'}</div>
                  <div><strong>Contact Rep:</strong> {selectedIssue.profiles?.full_name || 'N/A'}</div>
                  <div><strong>Email:</strong> {selectedIssue.profiles?.email || 'N/A'}</div>
                  <div><strong>Phone:</strong> {selectedIssue.profiles?.phone || selectedIssue.profiles?.mobile_number || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div className="drawer-footer">
              {selectedIssue.status !== 'Resolved' ? (
                <button
                  onClick={() => handleUpdateStatus(selectedIssue.id, 'Resolved')}
                  className="btn btn-primary"
                  style={{ backgroundColor: 'var(--success)', border: 'none' }}
                >
                  Resolve Ticket
                </button>
              ) : (
                <button onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Close details
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
