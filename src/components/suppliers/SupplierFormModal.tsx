// src/components/suppliers/SupplierFormModal.tsx

import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  ShieldCheck,
  MapPin,
  Calendar,
  CreditCard,
  Tag,
  Clock
} from 'lucide-react';
import {
  SupplierProfile,
  SupplierCategory,
  SupplierStatus,
  SupplierTier
} from '../../types/supplierScorecard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierProfile | null;
  onSave: (supplierData: Partial<SupplierProfile>) => Promise<any>;
}

export const SupplierFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  supplier,
  onSave
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(supplier?.id);

  const [code, setCode] = useState(supplier?.code || '');
  const [name, setName] = useState(supplier?.name || '');
  const [legalName, setLegalName] = useState(supplier?.legalName || '');
  const [category, setCategory] = useState<SupplierCategory>(supplier?.category || 'raw_materials');
  const [status, setStatus] = useState<SupplierStatus>(supplier?.status || 'active');
  const [tier, setTier] = useState<SupplierTier>(supplier?.tier || 'tier_2');
  const [contactPerson, setContactPerson] = useState(supplier?.contactPerson || '');
  const [role, setRole] = useState(supplier?.role || 'Sales Lead');
  const [email, setEmail] = useState(supplier?.email || '');
  const [phone, setPhone] = useState(supplier?.phone || '');
  const [whatsapp, setWhatsapp] = useState(supplier?.whatsapp || '');
  const [website, setWebsite] = useState(supplier?.website || '');
  const [gstin, setGstin] = useState(supplier?.gstin || '');
  const [pan, setPan] = useState(supplier?.pan || '');
  const [msmeRegNo, setMsmeRegNo] = useState(supplier?.msmeRegNo || '');
  const [paymentTerms, setPaymentTerms] = useState(supplier?.paymentTerms || 'Net 30 Days');
  const [deliveryTerms, setDeliveryTerms] = useState(
    supplier?.deliveryTerms || 'FOR Destination (Plant Gate)'
  );
  const [leadTimeDays, setLeadTimeDays] = useState(supplier?.leadTimeDays ?? 7);
  const [certificationsInput, setCertificationsInput] = useState(
    supplier?.certifications?.join(', ') || 'ISO 9001:2015'
  );
  const [selectedPlants, setSelectedPlants] = useState<string[]>(
    supplier?.primaryPlants || ['plant-pune']
  );
  const [street, setStreet] = useState(supplier?.address?.street || '');
  const [city, setCity] = useState(supplier?.address?.city || 'Pune');
  const [state, setState] = useState(supplier?.address?.state || 'Maharashtra');
  const [pinCode, setPinCode] = useState(supplier?.address?.pinCode || '411001');
  const [notes, setNotes] = useState(supplier?.notes || '');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing && !code) {
      setCode(`SUP-${Math.floor(100 + Math.random() * 900)}`);
    }
  }, [isEditing, code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Supplier name is required.');
      return;
    }
    if (!contactPerson.trim() || !email.trim()) {
      setError('Contact person and email are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const certs = certificationsInput
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);

      await onSave({
        ...(supplier || {}),
        code: code.trim().toUpperCase(),
        name: name.trim(),
        legalName: legalName.trim() || name.trim(),
        category,
        status,
        tier,
        contactPerson: contactPerson.trim(),
        role: role.trim(),
        email: email.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        website: website.trim() || undefined,
        gstin: gstin.trim().toUpperCase(),
        pan: pan.trim().toUpperCase() || undefined,
        msmeRegNo: msmeRegNo.trim() || undefined,
        paymentTerms: paymentTerms.trim(),
        deliveryTerms: deliveryTerms.trim(),
        leadTimeDays: Number(leadTimeDays) || 7,
        certifications: certs,
        primaryPlants: selectedPlants,
        address: {
          street: street.trim() || 'Industrial Estate',
          city: city.trim(),
          state: state.trim(),
          pinCode: pinCode.trim(),
          country: 'India'
        },
        notes: notes.trim()
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save supplier profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePlant = (plantId: string) => {
    if (selectedPlants.includes(plantId)) {
      if (selectedPlants.length > 1) {
        setSelectedPlants(selectedPlants.filter(p => p !== plantId));
      }
    } else {
      setSelectedPlants([...selectedPlants, plantId]);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl text-slate-100 flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? `Edit Supplier — ${supplier?.name}` : 'Register New Supplier in AVL Master'}
              </h2>
              <p className="text-xs text-slate-400">
                Commercial profile, quality certifications, and lead-time agreements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              {error}
            </div>
          )}

          {/* Identification & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                Supplier Code
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="SUP-XXX-01"
                className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                Supplier Display Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Tata Prime Steel Ltd."
                className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                Legal Entity Name
              </label>
              <input
                type="text"
                value={legalName}
                onChange={e => setLegalName(e.target.value)}
                placeholder="e.g. Tata Steel Limited"
                className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                Material / Specialty Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as SupplierCategory)}
                className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="raw_materials">Raw Materials (Steels, Alloys, Wire Rods)</option>
                <option value="tooling_dies">Tooling & Dies (H13 Blocks, Carbide)</option>
                <option value="consumables">Consumables & Lubricants (Hydraulic Oils)</option>
                <option value="fasteners_hardware">Fasteners & Hardware (Grade 8.8+)</option>
                <option value="subcontract_processing">Subcontract Processing (Heat Treat, Plating)</option>
                <option value="packaging_logistics">Packaging & Logistics</option>
              </select>
            </div>
          </div>

          {/* Status & Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                AVL Sourcing Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as SupplierStatus)}
                className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="preferred">Preferred Tier Partner (Priority Allocation)</option>
                <option value="active">Active Approved Supplier</option>
                <option value="under_review">Under Annual Review / Audit</option>
                <option value="probation">Probationary / Restricted POs</option>
                <option value="inactive">Inactive / Blacklisted</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                Nominal Lead Time (Days)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={leadTimeDays}
                onChange={e => setLeadTimeDays(Number(e.target.value))}
                className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="border-t border-slate-800 pt-4">
            <h3 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider mb-2">
              Key Account Representative
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400">Contact Person Name *</label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  placeholder="e.g. Rajesh Kulkarni"
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Designation / Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Institutional Sales Head"
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="orders@supplier.com"
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Phone / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98230 11982"
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Tax & Commercial Terms */}
          <div className="border-t border-slate-800 pt-4">
            <h3 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider mb-2">
              Commercial & Statutory Data
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400">GSTIN *</label>
                <input
                  type="text"
                  required
                  value={gstin}
                  onChange={e => setGstin(e.target.value)}
                  placeholder="27AAACT2948K1ZP"
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Payment Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                  placeholder="Net 30 Days"
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Delivery Terms</label>
                <input
                  type="text"
                  value={deliveryTerms}
                  onChange={e => setDeliveryTerms(e.target.value)}
                  placeholder="FOR Destination Gate"
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Quality Certifications & Plants */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                Quality Certifications (Comma separated)
              </label>
              <input
                type="text"
                value={certificationsInput}
                onChange={e => setCertificationsInput(e.target.value)}
                placeholder="ISO 9001:2015, IATF 16949, AS9100D"
                className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-1">
                Servicing Plants
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'plant-pune', label: 'Pune Heavy Forge' },
                  { id: 'plant-vadodara', label: 'Vadodara Machining' }
                ].map(p => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => togglePlant(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      selectedPlants.includes(p.id)
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] text-slate-400">Plant / Warehouse Address</label>
              <input
                type="text"
                value={street}
                onChange={e => setStreet(e.target.value)}
                placeholder="Plot & Industrial Zone"
                className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400">City & State</label>
              <input
                type="text"
                value={`${city}, ${state}`}
                onChange={e => {
                  const parts = e.target.value.split(',');
                  setCity(parts[0]?.trim() || city);
                  if (parts[1]) setState(parts[1]?.trim());
                }}
                placeholder="Pune, Maharashtra"
                className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Register Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
