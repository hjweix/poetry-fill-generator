import React from 'react';
import type { PoetryInput as PoetryInputType } from '../types';

interface PoetryInputProps {
  value: PoetryInputType;
  onChange: (poetry: PoetryInputType) => void;
}

const PoetryInput: React.FC<PoetryInputProps> = ({ value, onChange }) => {
  const handleChange = (field: keyof PoetryInputType, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  return (
    <div className="poetry-input">
      <div className="input-group">
        <label className="label">诗词标题：</label>
        <input
          type="text"
          value={value.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="请输入诗词标题"
          className="input"
        />
      </div>

      <div className="input-group">
        <label className="label">作者：</label>
        <input
          type="text"
          value={value.author}
          onChange={(e) => handleChange('author', e.target.value)}
          placeholder="请输入作者姓名"
          className="input"
        />
      </div>

      <div className="input-group">
        <label className="label">诗词内容：</label>
        <textarea
          value={value.content}
          onChange={(e) => handleChange('content', e.target.value)}
          placeholder="请输入诗词内容，每行一句&#10;例如：&#10;登临送目，正故国晚秋&#10;千里澄江似练，翠峰如簇"
          className="textarea"
          rows={8}
        />
      </div>
    </div>
  );
};

export default PoetryInput;