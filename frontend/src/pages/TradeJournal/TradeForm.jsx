import { useState, useEffect } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { todayISO } from '../../utils/formatDate';

export default function TradeForm({ initialData, onSubmit, onCancel, setups = [] }) {
  const { data: accounts } = useFetch('/accounts', []);

  const [formData, setFormData] = useState(
    initialData || {
      account_id: '',
      ticker: '',
      instrument_type: 'Equity',
      trade_setup: '',
      direction: 'Buy',
      entry_date: todayISO(),
      entry_time: '',
      quantity: '',
      entry_price: '',
      target_price: '',
      stoploss: '',
      margin_pct: 100,
      exit_date: '',
      exit_time: '',
      exit_price: '',
      ltp: '',
      remarks: '',
    }
  );

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.account_id) newErrors.account_id = 'Account is required';
    if (!formData.ticker) newErrors.ticker = 'Ticker is required';
    if (!formData.entry_price || parseFloat(formData.entry_price) <= 0) {
      newErrors.entry_price = 'Entry price must be > 0';
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be > 0';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      ...formData,
      account_id: parseInt(formData.account_id),
      quantity: parseFloat(formData.quantity),
      entry_price: parseFloat(formData.entry_price),
      target_price: formData.target_price ? parseFloat(formData.target_price) : null,
      stoploss: formData.stoploss ? parseFloat(formData.stoploss) : null,
      margin_pct: parseFloat(formData.margin_pct),
      exit_price: formData.exit_price ? parseFloat(formData.exit_price) : null,
      ltp: formData.ltp ? parseFloat(formData.ltp) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account */}
        <FormField
          label="Account"
          required
          error={errors.account_id}
        >
          <select
            name="account_id"
            value={formData.account_id}
            onChange={handleChange}
            className={`form-select ${errors.account_id ? 'border-secondary' : ''}`}
          >
            <option value="">Select account</option>
            {accounts?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.account_name}
              </option>
            ))}
          </select>
        </FormField>

        {/* Ticker */}
        <FormField
          label="Ticker"
          required
          error={errors.ticker}
        >
          <input
            type="text"
            name="ticker"
            value={formData.ticker}
            onChange={handleChange}
            placeholder="e.g., GOLDGUINEA"
            className={`form-input uppercase ${errors.ticker ? 'border-secondary' : ''}`}
          />
        </FormField>

        {/* Instrument Type */}
        <FormField label="Instrument Type">
          <select
            name="instrument_type"
            value={formData.instrument_type}
            onChange={handleChange}
            className="form-select"
          >
            <option>Commodity</option>
            <option>Equity</option>
            <option>Unlisted</option>
            <option>Crypto</option>
            <option>F&O</option>
          </select>
        </FormField>

        {/* Setup */}
        <FormField label="Setup">
          <select
            name="trade_setup"
            value={formData.trade_setup}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">None</option>
            {setups?.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </FormField>

        {/* Direction */}
        <FormField label="Direction" required>
          <select
            name="direction"
            value={formData.direction}
            onChange={handleChange}
            className="form-select"
          >
            <option value="Buy">Buy (Long)</option>
            <option value="Sell">Sell (Short)</option>
          </select>
        </FormField>

        {/* Entry Date */}
        <FormField label="Entry Date">
          <input
            type="date"
            name="entry_date"
            value={formData.entry_date}
            onChange={handleChange}
            className="form-input"
          />
        </FormField>

        {/* Quantity */}
        <FormField label="Quantity" required error={errors.quantity}>
          <input
            type="number"
            step="0.01"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="1"
            className={`form-input ${errors.quantity ? 'border-secondary' : ''}`}
          />
        </FormField>

        {/* Entry Price */}
        <FormField label="Entry Price" required error={errors.entry_price}>
          <input
            type="number"
            step="0.01"
            name="entry_price"
            value={formData.entry_price}
            onChange={handleChange}
            placeholder="0.00"
            className={`form-input ${errors.entry_price ? 'border-secondary' : ''}`}
          />
        </FormField>

        {/* Target Price */}
        <FormField label="Target Price">
          <input
            type="number"
            step="0.01"
            name="target_price"
            value={formData.target_price}
            onChange={handleChange}
            placeholder="0.00"
            className="form-input"
          />
        </FormField>

        {/* Stop Loss */}
        <FormField label="Stop Loss">
          <input
            type="number"
            step="0.01"
            name="stoploss"
            value={formData.stoploss}
            onChange={handleChange}
            placeholder="0.00"
            className="form-input"
          />
        </FormField>

        {/* Margin % */}
        <FormField label="Margin %">
          <input
            type="number"
            step="0.01"
            name="margin_pct"
            value={formData.margin_pct}
            onChange={handleChange}
            placeholder="100"
            className="form-input"
          />
        </FormField>

        {/* Exit Date */}
        <FormField label="Exit Date">
          <input
            type="date"
            name="exit_date"
            value={formData.exit_date}
            onChange={handleChange}
            className="form-input"
          />
        </FormField>

        {/* Exit Price */}
        <FormField label="Exit Price">
          <input
            type="number"
            step="0.01"
            name="exit_price"
            value={formData.exit_price}
            onChange={handleChange}
            placeholder="0.00"
            className="form-input"
          />
        </FormField>

        {/* LTP */}
        <FormField label="Last Traded Price">
          <input
            type="number"
            step="0.01"
            name="ltp"
            value={formData.ltp}
            onChange={handleChange}
            placeholder="0.00"
            className="form-input"
          />
        </FormField>
      </div>

      {/* Remarks */}
      <FormField label="Remarks">
        <textarea
          name="remarks"
          value={formData.remarks}
          onChange={handleChange}
          placeholder="Add any notes about this trade..."
          rows="3"
          className="form-input"
        />
      </FormField>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-outline-variant">
        <button
          type="button"
          onClick={onCancel}
          className="btn-outline"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
        >
          {initialData ? 'Update Trade' : 'Create Trade'}
        </button>
      </div>
    </form>
  );
}

function FormField({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-body-sm font-medium text-on-surface mb-2">
        {label}
        {required && <span className="text-secondary ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-secondary text-body-sm mt-1">{error}</p>
      )}
    </div>
  );
}
