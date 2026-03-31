import React, { useState } from 'react';
import { Layers, Trash2, ChevronDown, ChevronUp, Zap, BookOpen } from 'lucide-react';
import type { BatchPoetryItem, GroupSize } from '../types';
import { parseBatchPoetry } from '../utils/fillGenerator';
import GroupSizeSelector from './GroupSizeSelector';

interface BatchPoetryInputProps {
  items: BatchPoetryItem[];
  onChange: (items: BatchPoetryItem[]) => void;
}

const BatchPoetryInput: React.FC<BatchPoetryInputProps> = ({ items, onChange }) => {
  const [rawText, setRawText] = useState('');
  const [isParsed, setIsParsed] = useState(false);

  const handleParse = () => {
    if (!rawText.trim()) return;
    const parsed = parseBatchPoetry(rawText);
    onChange(parsed);
    setIsParsed(true);
  };

  const handleReset = () => {
    setRawText('');
    onChange([]);
    setIsParsed(false);
  };

  const updateItem = (id: string, field: 'title' | 'author' | 'content', value: string) => {
    onChange(items.map(item =>
      item.id === id
        ? { ...item, poetry: { ...item.poetry, [field]: value } }
        : item
    ));
  };

  const updateGroupSize = (id: string, size: GroupSize) => {
    onChange(items.map(item =>
      item.id === id ? { ...item, groupSize: size } : item
    ));
  };

  const deleteItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const toggleExpand = (id: string) => {
    onChange(items.map(item =>
      item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
    ));
  };

  const colorAccents = [
    'bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-blue-500',
    'bg-purple-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500',
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 粘贴输入区 */}
      {!isParsed ? (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-50 to-paper border-b border-amber-100">
            <Layers size={16} className="text-amber-600" />
            <span className="text-sm font-medium text-ink font-serif">批量粘贴输入</span>
          </div>
          <div className="p-4 space-y-3">
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder={`在此粘贴多首诗词，用空行分隔各首诗词。\n\n示例：\n《静夜思》 李白\n床前明月光，疑是地上霜。\n举头望明月，低头思故乡。\n\n《春晓》 孟浩然\n春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。`}
              className="w-full h-40 px-3 py-3 text-sm text-ink bg-paper/60 border border-amber-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent placeholder:text-gray-400 font-serif leading-relaxed transition-all"
            />
            <div className="flex gap-2">
              <button
                onClick={handleParse}
                disabled={!rawText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95"
              >
                <Zap size={15} />
                智能解析
              </button>
              <p className="flex items-center text-xs text-gray-400 ml-1">
                用空行分隔多首诗词，支持《标题》作者格式自动识别
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* 解析结果区 */
        <div className="space-y-3 animate-slide-up">
          {/* 顶部操作栏 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-amber-600" />
              <span className="text-sm font-medium text-ink font-serif">
                已识别 <span className="text-primary font-bold">{items.length}</span> 首诗词
              </span>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-primary transition-colors px-3 py-1 rounded-lg hover:bg-red-50"
            >
              重新输入
            </button>
          </div>

          {/* 诗词卡片列表 */}
          {items.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              {/* 卡片头部 */}
              <div className="flex items-center gap-0 pr-3">
                {/* 彩色竖条 */}
                <div className={`w-1.5 self-stretch rounded-l-2xl ${colorAccents[index % colorAccents.length]}`} />

                <div className="flex-1 flex items-center gap-3 px-3 py-3">
                  {/* 序号 */}
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-500 flex items-center justify-center">
                    {index + 1}
                  </span>

                  {/* 标题/作者内联编辑 */}
                  <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0">
                    <input
                      type="text"
                      value={item.poetry.title}
                      onChange={e => updateItem(item.id, 'title', e.target.value)}
                      placeholder="标题"
                      className="w-32 px-2 py-1 text-sm font-medium text-ink bg-paper/60 border border-amber-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-300 font-serif"
                    />
                    <span className="text-gray-300 text-xs">·</span>
                    <input
                      type="text"
                      value={item.poetry.author}
                      onChange={e => updateItem(item.id, 'author', e.target.value)}
                      placeholder="作者"
                      className="w-24 px-2 py-1 text-sm text-gray-500 bg-paper/60 border border-amber-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-300 font-serif"
                    />
                    <span className="text-xs text-gray-300 ml-1">
                      {item.poetry.content.split('\n').filter(l => l.trim()).length} 句
                    </span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    title={item.isExpanded ? '折叠' : '展开'}
                  >
                    {item.isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="删除"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* 正文区（可折叠）*/}
              {item.isExpanded && (
                <div className="px-4 pb-3 ml-1.5 animate-fade-in">
                  <textarea
                    value={item.poetry.content}
                    onChange={e => updateItem(item.id, 'content', e.target.value)}
                    rows={Math.max(3, item.poetry.content.split('\n').length)}
                    className="w-full px-3 py-2 text-sm text-gray-700 bg-paper/50 border border-amber-100/80 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-amber-300 font-serif leading-relaxed transition-all"
                    placeholder="诗词正文（每行一句）"
                  />
                </div>
              )}

              {/* 分题设置（紧凑模式）*/}
              <GroupSizeSelector
                value={item.groupSize ?? 'whole'}
                onChange={size => updateGroupSize(item.id, size)}
                totalLines={item.poetry.content.split('\n').filter(l => l.trim()).length}
                compact
              />
            </div>
          ))}

          {/* 空状态 */}
          {items.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              所有诗词已删除，请重新输入
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchPoetryInput;
