import React, { useState } from 'react';
import { Button } from './ui/button';

interface EditableNumberCellProps {
  value: number;
  min?: number;
  onSave: (newValue: number) => void;
  onReset?: () => void;
  showReset?: boolean;
}

const EditableNumberCell: React.FC<EditableNumberCellProps> = ({ value, min = 0, onSave, onReset, showReset }) => {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const handleEdit = () => {
    setEditing(true);
    setInputValue(value);
  };
  const handleCancel = () => {
    setEditing(false);
    setInputValue(value);
  };
  const handleSave = () => {
    if (inputValue !== value) onSave(inputValue);
    setEditing(false);
  };
  const handleReset = () => {
    if (onReset) onReset();
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 justify-center">
      {editing ? (
        <>
          <input
            type="number"
            min={min}
            value={inputValue}
            onChange={e => setInputValue(Number(e.target.value))}
            className="border px-1 w-16 rounded text-center"
            style={{ maxWidth: 60 }}
          />
          <Button size="sm" variant="default" onClick={handleSave} disabled={inputValue === value}>저장</Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>취소</Button>
          {showReset && onReset && (
            <Button size="sm" variant="outline" onClick={handleReset}>리셋</Button>
          )}
        </>
      ) : (
        <>
          <span>{value}</span>
          <Button size="sm" variant="outline" onClick={handleEdit}>수정</Button>
          {showReset && onReset && (
            <Button size="sm" variant="outline" onClick={handleReset}>리셋</Button>
          )}
        </>
      )}
    </div>
  );
};

export default EditableNumberCell;
