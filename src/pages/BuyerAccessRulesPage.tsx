import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, LogOut, BarChart2, List, Settings, X, Plus, Shield, Users, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';

interface BuyerAccessRules {
  accessMode: 'open' | 'whitelist_only' | 'invite_only';
  whitelistedBuyers: string[];
  blacklistedBuyers: string[];
  dealApproval: {
    autoApprove: boolean;
    autoApproveConditions: {
      meetsFloorPrice: boolean;
      passesBrandSafety: boolean;
      buyerVerified: boolean;
    };
    manualReviewFor: {
      dealsAboveThreshold: boolean;
      thresholdAmount: number;
      sensitiveContent: boolean;
      firstTimeBuyers: boolean;
    };
  };
  contentRestrictions: {
    prohibitedCategories: string[];
    brandSafetyLevel: 'relaxed' | 'standard' | 'strict';
    additionalRestrictions: string;
  };
}

const CONTENT_CATEGORIES = [
  { id: 'alcohol_tobacco', label: 'Alcohol & Tobacco' },
  { id: 'gambling', label: 'Gambling & Betting' },
  { id: 'political', label: 'Political Campaigns' },
  { id: 'weight_loss', label: 'Weight Loss / Health Supplements' },
  { id: 'dating', label: 'Dating Services' },
  { id: 'adult', label: 'Adult Content' },
  { id: 'cryptocurrency', label: 'Cryptocurrency' },
  { id: 'firearms', label: 'Firearms & Weapons' },
];

export default function BuyerAccessRulesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [inventoryName, setInventoryName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [newWhitelistEntry, setNewWhitelistEntry] = useState('');
  const [newBlacklistEntry, setNewBlacklistEntry] = useState('');

  const [rules, setRules] = useState<BuyerAccessRules>({
    accessMode: 'open',
    whitelistedBuyers: [],
    blacklistedBuyers: [],
    dealApproval: {
      autoApprove: false,
      autoApproveConditions: {
        meetsFloorPrice: true,
        passesBrandSafety: true,
        buyerVerified: true,
      },
      manualReviewFor: {
        dealsAboveThreshold: true,
        thresholdAmount: 10000,
        sensitiveContent: true,
        firstTimeBuyers: true,
      },
    },
    contentRestrictions: {
      prohibitedCategories: [],
      brandSafetyLevel: 'standard',
      additionalRestrictions: '',
    },
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      } else {
        if (user.user_metadata?.role !== 'premium_publisher') {
          navigate('/dashboard');
        }
        setUser(user);
        fetchInventoryDetails();
        fetchExistingRules();
      }
    };
    checkUser();
  }, [navigate, id]);

  const fetchInventoryDetails = async () => {
    try {
      const res = await fetch(`/api/inventory/${id}`);
      const data = await res.json();
      if (data.success) {
        setInventoryName(data.data.location_data.address);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  const fetchExistingRules = async () => {
    try {
      const res = await fetch(`/api/inventory/${id}/rules`);
      const data = await res.json();
      if (data.success && data.data) {
        // Map database fields to our state structure
        const dbRules = data.data;
        setRules({
          accessMode: dbRules.access_mode || 'open',
          whitelistedBuyers: dbRules.whitelisted_buyers || [],
          blacklistedBuyers: dbRules.blacklisted_buyers || [],
          dealApproval: dbRules.deal_approval || {
            autoApprove: false,
            autoApproveConditions: {
              meetsFloorPrice: true,
              passesBrandSafety: true,
              buyerVerified: true,
            },
            manualReviewFor: {
              dealsAboveThreshold: true,
              thresholdAmount: 10000,
              sensitiveContent: true,
              firstTimeBuyers: true,
            },
          },
          contentRestrictions: {
            prohibitedCategories: dbRules.prohibited_categories || [],
            brandSafetyLevel: dbRules.brand_safety_level || 'standard',
            additionalRestrictions: dbRules.additional_restrictions || '',
          },
        });
      }
    } catch (err) {
      console.error('Error fetching rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWhitelist = () => {
    if (!newWhitelistEntry.trim()) return;
    if (rules.whitelistedBuyers.includes(newWhitelistEntry.trim())) {
      toast.error('Entry already exists');
      return;
    }
    setRules({
      ...rules,
      whitelistedBuyers: [...rules.whitelistedBuyers, newWhitelistEntry.trim()]
    });
    setNewWhitelistEntry('');
  };

  const handleRemoveWhitelist = (entry: string) => {
    setRules({
      ...rules,
      whitelistedBuyers: rules.whitelistedBuyers.filter(e => e !== entry)
    });
  };

  const handleAddBlacklist = () => {
    if (!newBlacklistEntry.trim()) return;
    if (rules.blacklistedBuyers.includes(newBlacklistEntry.trim())) {
      toast.error('Entry already exists');
      return;
    }
    setRules({
      ...rules,
      blacklistedBuyers: [...rules.blacklistedBuyers, newBlacklistEntry.trim()]
    });
    setNewBlacklistEntry('');
  };

  const handleRemoveBlacklist = (entry: string) => {
    setRules({
      ...rules,
      blacklistedBuyers: rules.blacklistedBuyers.filter(e => e !== entry)
    });
  };

  const toggleProhibitedCategory = (categoryId: string) => {
    const current = rules.contentRestrictions.prohibitedCategories;
    const updated = current.includes(categoryId)
      ? current.filter(c => c !== categoryId)
      : [...current, categoryId];
    
    setRules({
      ...rules,
      contentRestrictions: {
        ...rules.contentRestrictions,
        prohibitedCategories: updated
      }
    });
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/inventory/${id}/rules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_id: user.id,
          access_mode: rules.accessMode,
          whitelisted_buyers: rules.whitelistedBuyers,
          blacklisted_buyers: rules.blacklistedBuyers,
          deal_approval: rules.dealApproval,
          prohibited_categories: rules.contentRestrictions.prohibitedCategories,
          brand_safety_level: rules.contentRestrictions.brandSafetyLevel,
          additional_restrictions: rules.contentRestrictions.additionalRestrictions,
        })
      });
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save rules');
      }
      
      toast.success('Buyer access rules saved successfully');
      navigate(`/publisher/inventory/${id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save rules');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-100">
          <Link to="/publisher-dashboard" className="flex items-center space-x-2">
            <Logo className="h-8" />
            <span className="text-xl font-heading font-bold text-secondary">Publisher</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/publisher-dashboard" className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium transition-colors">
            <BarChart2 className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link to="/publisher/my-inventory" className="flex items-center space-x-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
            <List className="w-5 h-5" />
            <span>My Inventory</span>
          </Link>
          <a href="#" className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium transition-colors">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </a>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate text-gray-900">{user.user_metadata?.business_name || 'Publisher'}</p>
              <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-600 flex items-center mt-0.5">
                <LogOut className="w-3 h-3 mr-1" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Back Button */}
        <Link 
          to={`/publisher/inventory/${id}`}
          className="inline-flex items-center text-gray-500 hover:text-secondary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Inventory Details
        </Link>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-heading font-bold text-secondary mb-2">
                Set Buyer Access & Content Rules
              </h1>
              <p className="text-gray-500">
                Control who can book your inventory and what content is acceptable
              </p>
              {inventoryName && (
                <p className="text-sm text-primary font-medium mt-2">
                  For: {inventoryName}
                </p>
              )}
            </div>

            {/* Buyer Access Control */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
              <h2 className="text-lg font-bold text-secondary mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-gray-400" />
                Buyer Access Control
              </h2>
              
              {/* Access Mode */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Access Mode</label>
                <select
                  value={rules.accessMode}
                  onChange={(e) => setRules({ ...rules, accessMode: e.target.value as any })}
                  className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="open">Open to All Verified Buyers (Recommended)</option>
                  <option value="whitelist_only">Whitelist Only</option>
                  <option value="invite_only">Invite Only (Private)</option>
                </select>
              </div>

              {/* Whitelist */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Whitelist Buyers (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newWhitelistEntry}
                    onChange={(e) => setNewWhitelistEntry(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddWhitelist()}
                    placeholder="Enter buyer email or company name"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button
                    onClick={handleAddWhitelist}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {rules.whitelistedBuyers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {rules.whitelistedBuyers.map((entry) => (
                      <span
                        key={entry}
                        className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                      >
                        {entry}
                        <button onClick={() => handleRemoveWhitelist(entry)} className="ml-2 hover:text-blue-900">
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Blacklist */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blacklist Buyers (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newBlacklistEntry}
                    onChange={(e) => setNewBlacklistEntry(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddBlacklist()}
                    placeholder="Enter buyer email or company name to block"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button
                    onClick={handleAddBlacklist}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {rules.blacklistedBuyers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {rules.blacklistedBuyers.map((entry) => (
                      <span
                        key={entry}
                        className="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm"
                      >
                        {entry}
                        <button onClick={() => handleRemoveBlacklist(entry)} className="ml-2 hover:text-red-900">
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Deal Approval Settings */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
              <h2 className="text-lg font-bold text-secondary mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-gray-400" />
                Deal Approval Settings
              </h2>

              {/* Auto-approve toggle */}
              <div className="mb-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.dealApproval.autoApprove}
                    onChange={(e) => setRules({
                      ...rules,
                      dealApproval: { ...rules.dealApproval, autoApprove: e.target.checked }
                    })}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Auto-approve deals that meet my criteria</span>
                </label>
              </div>

              {/* Auto-approve conditions */}
              {rules.dealApproval.autoApprove && (
                <div className="ml-8 mb-6 space-y-3">
                  <p className="text-sm text-gray-500 mb-2">Auto-approve when:</p>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rules.dealApproval.autoApproveConditions.meetsFloorPrice}
                      onChange={(e) => setRules({
                        ...rules,
                        dealApproval: {
                          ...rules.dealApproval,
                          autoApproveConditions: {
                            ...rules.dealApproval.autoApproveConditions,
                            meetsFloorPrice: e.target.checked
                          }
                        }
                      })}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-600">Deal price meets or exceeds my floor price</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rules.dealApproval.autoApproveConditions.passesBrandSafety}
                      onChange={(e) => setRules({
                        ...rules,
                        dealApproval: {
                          ...rules.dealApproval,
                          autoApproveConditions: {
                            ...rules.dealApproval.autoApproveConditions,
                            passesBrandSafety: e.target.checked
                          }
                        }
                      })}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-600">Content passes brand safety and adjacency rules</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rules.dealApproval.autoApproveConditions.buyerVerified}
                      onChange={(e) => setRules({
                        ...rules,
                        dealApproval: {
                          ...rules.dealApproval,
                          autoApproveConditions: {
                            ...rules.dealApproval.autoApproveConditions,
                            buyerVerified: e.target.checked
                          }
                        }
                      })}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-600">Buyer is verified and not blacklisted</span>
                  </label>
                </div>
              )}

              {/* Manual review conditions */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Manual Review Required For</p>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.dealApproval.manualReviewFor.dealsAboveThreshold}
                    onChange={(e) => setRules({
                      ...rules,
                      dealApproval: {
                        ...rules.dealApproval,
                        manualReviewFor: {
                          ...rules.dealApproval.manualReviewFor,
                          dealsAboveThreshold: e.target.checked
                        }
                      }
                    })}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-600">
                    Deals above AED{' '}
                    <input
                      type="number"
                      value={rules.dealApproval.manualReviewFor.thresholdAmount}
                      onChange={(e) => setRules({
                        ...rules,
                        dealApproval: {
                          ...rules.dealApproval,
                          manualReviewFor: {
                            ...rules.dealApproval.manualReviewFor,
                            thresholdAmount: parseInt(e.target.value) || 0
                          }
                        }
                      })}
                      className="w-24 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
                    />
                  </span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.dealApproval.manualReviewFor.sensitiveContent}
                    onChange={(e) => setRules({
                      ...rules,
                      dealApproval: {
                        ...rules.dealApproval,
                        manualReviewFor: {
                          ...rules.dealApproval.manualReviewFor,
                          sensitiveContent: e.target.checked
                        }
                      }
                    })}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-600">Sensitive content categories</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.dealApproval.manualReviewFor.firstTimeBuyers}
                    onChange={(e) => setRules({
                      ...rules,
                      dealApproval: {
                        ...rules.dealApproval,
                        manualReviewFor: {
                          ...rules.dealApproval.manualReviewFor,
                          firstTimeBuyers: e.target.checked
                        }
                      }
                    })}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-600">First-time buyers</span>
                </label>
              </div>
            </div>

            {/* Content Adjacency & Brand Safety */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
              <h2 className="text-lg font-bold text-secondary mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-gray-400" />
                Content Adjacency & Brand Safety
              </h2>

              {/* Prohibited Categories */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prohibited Content Categories
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Select categories you do not want displayed on your inventory
                </p>
                <div className="space-y-2">
                  {CONTENT_CATEGORIES.map((category) => (
                    <label key={category.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rules.contentRestrictions.prohibitedCategories.includes(category.id)}
                        onChange={() => toggleProhibitedCategory(category.id)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-600">{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Brand Safety Level */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Safety Level
                </label>
                <select
                  value={rules.contentRestrictions.brandSafetyLevel}
                  onChange={(e) => setRules({
                    ...rules,
                    contentRestrictions: {
                      ...rules.contentRestrictions,
                      brandSafetyLevel: e.target.value as any
                    }
                  })}
                  className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="relaxed">Relaxed (Fewer restrictions)</option>
                  <option value="standard">Standard (Recommended)</option>
                  <option value="strict">Strict (Maximum protection)</option>
                </select>
              </div>

              {/* Additional Restrictions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Content Restrictions (Optional)
                </label>
                <textarea
                  value={rules.contentRestrictions.additionalRestrictions}
                  onChange={(e) => setRules({
                    ...rules,
                    contentRestrictions: {
                      ...rules.contentRestrictions,
                      additionalRestrictions: e.target.value
                    }
                  })}
                  placeholder="Describe any specific brands, competitors, or content types you want to exclude..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Link
                to={`/publisher/inventory/${id}`}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Back
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
