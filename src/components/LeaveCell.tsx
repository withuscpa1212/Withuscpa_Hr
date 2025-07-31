import React, { useState } from 'react';

interface LeaveCellProps {
  earned_days: number;
  used_days: number;
  remaining_days: number;
  editable: boolean;
  onUpdateEarned?: (newEarned: number) => void;
}

const LeaveCell: React.FC<LeaveCellProps> = ({ earned_days, used_days, remaining_days, editable, onUpdateEarned }) => {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(earned_days);

  const handleEdit = () => setEditing(true);
  const handleCancel = () => {
    setEditing(false);
    setInputValue(earned_days);
  };
  const handleSave = () => {
    if (onUpdateEarned) onUpdateEarned(inputValue);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-1 items-center">
      <div>
        <span className="font-bold">총연차: </span>
        {editable && editing ? (
          <>
            <input
              type="number"
              min={used_days}
              className="border px-1 w-16 rounded"
              value={inputValue}
              onChange={e => setInputValue(Number(e.target.value))}
            />
            <button className="ml-1 text-mint-600 hover:underline" onClick={handleSave}>저장</button>
            <button className="ml-1 text-gray-400 hover:underline" onClick={handleCancel}>취소</button>
          </>
        ) : (
          <>
            <span>{earned_days}</span>
            {editable && (
              <button className="ml-2 text-xs text-blue-500 hover:underline" onClick={handleEdit}>수정</button>
            )}
          </>
        )}
      </div>
      <div><span className="font-bold">사용연차: </span>{used_days}</div>
      <div><span className="font-bold">남은연차: </span>{remaining_days}</div>
    </div>
  );
};

export default LeaveCell;
