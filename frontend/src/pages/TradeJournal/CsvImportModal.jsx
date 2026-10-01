import { useState } from 'react';

export default function CsvImportModal({ onImport, onCancel }) {
  const [csvText, setCsvText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!csvText.trim()) {
      setError('Please paste CSV content');
      return;
    }
    onImport(csvText);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface-container rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar border border-outline-variant">
        {/* Header */}
        <div className="sticky top-0 bg-surface-container-high border-b border-outline-variant px-4 sm:px-6 py-4 flex justify-between items-center gap-3">
          <h2 className="text-headline-md sm:text-headline-lg text-on-surface">Import Trades from CSV</h2>
          <button
            onClick={onCancel}
            className="text-on-surface-variant hover:text-on-surface text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Instructions */}
          <div>
            <p className="text-body-sm text-on-surface-variant mb-3">
              Paste CSV content with the following columns:
            </p>
            <div className="bg-surface-container-lowest rounded p-3 text-body-sm font-mono text-on-surface-variant overflow-x-auto mb-4">
              <code>account_id,ticker,instrument_type,trade_setup,direction,entry_date,entry_time,quantity,entry_price,target_price,stoploss,margin_pct,exit_date,exit_time,exit_price,ltp,remarks</code>
            </div>
          </div>

          {/* CSV Input */}
          <div>
            <label className="block text-body-sm font-medium text-on-surface mb-2">CSV Content</label>
            <textarea
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                if (error) setError('');
              }}
              rows={10}
              placeholder="account_id,ticker,direction,entry_date,entry_time,quantity,entry_price,..."
              className="form-input w-full font-mono text-body-sm"
            />
            {error && (
              <p className="text-secondary text-body-sm mt-2">{error}</p>
            )}
          </div>

          {/* Example */}
          <div className="bg-surface-container-lowest rounded p-3">
            <p className="text-body-sm font-medium text-on-surface-variant mb-2">Example:</p>
            <code className="text-body-sm text-on-surface-variant whitespace-pre-wrap break-words">
              {`1,GOLDGUINEA,Commodity,BreakoutAbove,BUY,2024-01-15,09:30,10,5000,5200,4800,100
1,SBIN,Equity,Support,BUY,2024-01-16,10:00,5,540,600,500,100`}
            </code>
          </div>

          {/* Actions */}
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
              Import Trades
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
