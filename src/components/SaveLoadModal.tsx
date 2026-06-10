import { useState, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { getSaveInfo, hasSavedGame, deleteSave, exportSaveToFile, importSaveFromFile } from '../game/Storage';
import { GameSave } from '../game/types';
import { X, Save, FolderOpen, Trash2, Download, Upload, Play } from 'lucide-react';

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SaveLoadModal({ isOpen, onClose }: SaveLoadModalProps) {
  const dispatch = useGameStore((state) => state.dispatch);
  const saveGame = useGameStore((state) => state.save);
  const [saveInfo, setSaveInfo] = useState(getSaveInfo());
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const handleSave = () => {
    const success = saveGame();
    if (success) {
      setSaveInfo(getSaveInfo());
      alert('游戏已保存！');
    } else {
      alert('保存失败！');
    }
  };

  const handleLoad = () => {
    const save = getSaveInfo();
    if (!save) {
      alert('没有找到存档！');
      return;
    }

    if (confirm('确定要加载存档吗？当前进度将丢失！')) {
      const fullSave = getSaveInfo();
      if (fullSave) {
        const json = localStorage.getItem('city_delivery_game_save');
        if (json) {
          const gameSave = JSON.parse(json) as GameSave;
          dispatch({ type: 'LOAD_GAME', save: gameSave });
          setSaveInfo(getSaveInfo());
          onClose();
        }
      }
    }
  };

  const handleDelete = () => {
    if (confirm('确定要删除存档吗？此操作不可恢复！')) {
      deleteSave();
      setSaveInfo(null);
      alert('存档已删除！');
    }
  };

  const handleExport = () => {
    const json = localStorage.getItem('city_delivery_game_save');
    if (json) {
      const save = JSON.parse(json) as GameSave;
      exportSaveToFile(save);
    } else {
      alert('没有可导出的存档！');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const save = await importSaveFromFile(file);
      if (confirm('确定要导入这个存档吗？当前进度将丢失！')) {
        localStorage.setItem('city_delivery_game_save', JSON.stringify(save));
        dispatch({ type: 'LOAD_GAME', save });
        setSaveInfo(getSaveInfo());
        alert('存档导入成功！');
        onClose();
      }
    } catch (error) {
      alert('导入失败：无效的存档文件！');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="game-card p-6 w-[500px]">
        <div className="flex justify-between items-start mb-6">
          <h3 className="font-pixel text-lg text-game-neon glow-text">存档管理</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-game-night/50 border border-gray-700 rounded p-4">
            <h4 className="font-pixel text-xs text-gray-400 mb-3">当前存档信息</h4>
            {saveInfo ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-retro text-sm text-gray-300">保存时间</span>
                  <span className="font-retro text-sm text-game-neon">{formatDate(saveInfo.savedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-retro text-sm text-gray-300">完成订单</span>
                  <span className="font-retro text-sm text-game-success">{saveInfo.completedOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-retro text-sm text-gray-300">当前金钱</span>
                  <span className="font-retro text-sm text-game-streetLight">¥{saveInfo.money}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Save size={32} className="mx-auto text-gray-600 mb-2" />
                <p className="font-retro text-sm text-gray-500">暂无存档</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSave}
              className="pixel-btn pixel-btn-success flex items-center justify-center gap-2"
            >
              <Save size={16} />
              保存游戏
            </button>

            <button
              onClick={handleLoad}
              disabled={!hasSavedGame()}
              className={`pixel-btn flex items-center justify-center gap-2 ${
                !hasSavedGame() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Play size={16} />
              读取存档
            </button>

            <button
              onClick={handleExport}
              disabled={!hasSavedGame()}
              className={`pixel-btn flex items-center justify-center gap-2 ${
                !hasSavedGame() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Download size={16} />
              导出存档
            </button>

            <button
              onClick={handleImportClick}
              className="pixel-btn flex items-center justify-center gap-2"
            >
              <Upload size={16} />
              导入存档
            </button>

            <button
              onClick={handleDelete}
              disabled={!hasSavedGame()}
              className={`pixel-btn pixel-btn-danger col-span-2 flex items-center justify-center gap-2 ${
                !hasSavedGame() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Trash2 size={16} />
              删除存档
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        <div className="mt-4 p-3 bg-game-night/50 rounded border border-gray-700">
          <p className="font-retro text-xs text-gray-500">
            💡 存档以 JSON 格式保存在浏览器本地。你可以导出存档文件备份，或导入之前的存档。
          </p>
        </div>
      </div>
    </div>
  );
}
