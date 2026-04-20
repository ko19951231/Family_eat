/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { 
  Utensils, 
  Users, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ArrowRight, 
  History, 
  Trophy,
  RefreshCw,
  EyeOff,
  Vote
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";

type Stage = 'SETUP' | 'VOTERS' | 'VOTING' | 'PASS_DEVICE' | 'RESULTS';

interface Restaurant {
  id: string;
  name: string;
}

interface Voter {
  id: string;
  name: string;
  votes: Record<string, number>; // restaurantId -> voteCount
  hasVoted: boolean;
}

interface CityModule {
  id: string;
  name: string;
  restaurants: Restaurant[];
}

const TOTAL_VOTES_PER_PERSON = 10;
const STORAGE_KEY = 'family_food_decider_data';

export default function App() {
  const [stage, setStage] = useState<Stage>('SETUP');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0);
  const [newRestaurantName, setNewRestaurantName] = useState("");
  const [newVoterName, setNewVoterName] = useState("");
  const [shuffledIds, setShuffledIds] = useState<string[]>([]);
  
  // City Modules State
  const [cities, setCities] = useState<CityModule[]>([]);
  const [currentCityId, setCurrentCityId] = useState<string>("");
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [tempCityName, setTempCityName] = useState("");
  const [cityToDelete, setCityToDelete] = useState<string | null>(null);

  // Persistence: Load Data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.cities) setCities(data.cities);
        if (data.currentCityId) setCurrentCityId(data.currentCityId);
        if (data.voters) setVoters(data.voters);
        
        // Find and load the current city's restaurants
        const currentCity = data.cities.find((c: any) => c.id === data.currentCityId);
        if (currentCity) {
          setRestaurants(currentCity.restaurants);
        }
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    }
  }, []);

  // Persistence: Save Data
  useEffect(() => {
    // Only save core data, don't save temporary voting state like stage or shuffledIds
    const data = {
      cities,
      currentCityId,
      voters: voters.map(v => ({ ...v, votes: {}, hasVoted: false })) // Reset votes when saving to keep it fresh
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [cities, currentCityId, voters]);

  // Sync current city restaurants when currentCityId changes
  const handleCityChange = (cityId: string) => {
    setCurrentCityId(cityId);
    const city = cities.find(c => c.id === cityId);
    if (city) {
      setRestaurants(city.restaurants);
    }
  };

  const createCity = () => {
    if (!tempCityName.trim()) return;
    const newCity: CityModule = {
      id: crypto.randomUUID(),
      name: tempCityName.trim(),
      restaurants: []
    };
    setCities([...cities, newCity]);
    handleCityChange(newCity.id);
    setIsAddingCity(false);
    setTempCityName("");
  };

  const deleteCity = (id: string) => {
    const newCities = cities.filter(c => c.id !== id);
    setCities(newCities);
    if (currentCityId === id) {
      if (newCities.length > 0) {
        handleCityChange(newCities[0].id);
      } else {
        setCurrentCityId("");
        setRestaurants([]);
      }
    }
  };

  // Sync restaurants back to cities state
  useEffect(() => {
    if (currentCityId) {
      setCities(prev => prev.map(c => 
        c.id === currentCityId ? { ...c, restaurants } : c
      ));
    }
  }, [restaurants]);

  const currentVoter = voters[currentVoterIndex];

  // Helper: Get Icon based on keywords
  const getFoodIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("拉麵") || n.includes("湯麵") || n.includes("麵")) return "🍜";
    if (n.includes("漢堡") || n.includes("麥當勞") || n.includes("肯德基") || n.includes("速食")) return "🍔";
    if (n.includes("披薩") || n.includes("pizza")) return "🍕";
    if (n.includes("餃") || n.includes("小籠包") || n.includes("點心") || n.includes("鍋貼")) return "🥟";
    if (n.includes("火鍋") || n.includes("鍋")) return "🍲";
    if (n.includes("壽司") || n.includes("生魚片") || n.includes("日料")) return "🍣";
    if (n.includes("義大利麵") || n.includes("pasta")) return "🍝";
    if (n.includes("飯") || n.includes("便當") || n.includes("丼")) return "🍱";
    if (n.includes("牛排") || n.includes("肉")) return "🥩";
    if (n.includes("甜點") || n.includes("蛋糕") || n.includes("冰")) return "🍦";
    if (n.includes("咖啡") || n.includes("茶")) return "☕";
    if (n.includes("炸雞") || n.includes("鹹酥雞")) return "🍗";
    if (n.includes("燒烤") || n.includes("串燒")) return "🍢";
    return "🍴"; // Default icon
  };

  // Helper: Shuffle Array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const startVoting = () => {
    setShuffledIds(shuffleArray(restaurants.map(r => r.id)));
    setStage('VOTING');
  };

  // Helper: Add Restaurant
  const addRestaurant = () => {
    if (!newRestaurantName.trim()) return;
    setRestaurants([...restaurants, { id: crypto.randomUUID(), name: newRestaurantName.trim() }]);
    setNewRestaurantName("");
  };

  // Helper: Add Voter
  const addVoter = () => {
    if (!newVoterName.trim()) return;
    setVoters([...voters, { 
      id: crypto.randomUUID(), 
      name: newVoterName.trim(), 
      votes: {}, 
      hasVoted: false 
    }]);
    setNewVoterName("");
  };

  // Helper: Handle Vote Change
  const handleVoteChange = (restaurantId: string, delta: number) => {
    const currentVoter = voters[currentVoterIndex];
    if (!currentVoter) return;
    
    const currentVoteCount = currentVoter.votes[restaurantId] || 0;
    const totalUsed = Object.values(currentVoter.votes).reduce((a: number, b: number) => a + (b as number), 0) as number;
    
    if (delta > 0 && totalUsed >= TOTAL_VOTES_PER_PERSON) return;
    if (delta < 0 && currentVoteCount <= 0) return;

    setVoters(voters.map((v, i) => {
      if (i === currentVoterIndex) {
        return {
          ...v,
          votes: {
            ...v.votes,
            [restaurantId]: currentVoteCount + delta
          }
        };
      }
      return v;
    }));
  };

  // Helper: Finish Current Vote
  const finishVote = () => {
    const updatedVoters = [...voters];
    updatedVoters[currentVoterIndex].hasVoted = true;
    setVoters(updatedVoters);

    if (currentVoterIndex < voters.length - 1) {
      setStage('PASS_DEVICE');
    } else {
      setStage('RESULTS');
    }
  };

  // Helper: Next Voter
  const nextVoter = () => {
    setCurrentVoterIndex(currentVoterIndex + 1);
    setShuffledIds(shuffleArray(restaurants.map(r => r.id)));
    setStage('VOTING');
  };

  // Calculations
  const results = useMemo(() => {
    const tally: Record<string, number> = {};
    restaurants.forEach(r => tally[r.id] = 0);
    voters.forEach(v => {
      Object.entries(v.votes).forEach(([rid, count]) => {
        const voteCount = count as number;
        if (tally[rid] !== undefined) tally[rid] += voteCount;
      });
    });
    return Object.entries(tally)
      .map(([id, count]) => ({
        id,
        name: restaurants.find(r => r.id === id)?.name || "Unknown",
        count: count as number
      }))
      .sort((a, b) => (b.count as number) - (a.count as number));
  }, [restaurants, voters]);

  const resetAll = () => {
    setVoters([]);
    setStage('SETUP');
    setCurrentVoterIndex(0);
  };

  // --- Renders ---

  const renderSetup = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6 sm:space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-left space-y-1 sm:space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">第一步：列出候選名單</h2>
          <p className="text-sm sm:text-base text-slate-500 font-medium italic">或是選擇一個城市口袋名單</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border-2 border-slate-100 shadow-sm w-full sm:w-auto overflow-hidden">
          {isAddingCity ? (
            <div className="flex items-center gap-2 flex-1 animate-in slide-in-from-right-2">
              <input 
                autoFocus
                type="text"
                value={tempCityName}
                onChange={(e) => setTempCityName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createCity()}
                placeholder="輸入城市名..."
                className="bg-slate-50 px-3 py-1.5 rounded-lg outline-none font-bold text-slate-600 text-sm w-32"
              />
              <button 
                onClick={createCity}
                className="p-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-black text-xs"
              >
                儲存
              </button>
              <button 
                onClick={() => setIsAddingCity(false)}
                className="p-1.5 text-slate-300 hover:text-slate-500 transition-all"
              >
                取消
              </button>
            </div>
          ) : (
            <>
              <select 
                value={currentCityId}
                onChange={(e) => handleCityChange(e.target.value)}
                className="flex-1 sm:w-40 bg-transparent outline-none font-bold text-slate-600 px-3 py-2 text-sm appearance-none cursor-pointer"
              >
                <option value="">選擇城市口袋...</option>
                {cities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button 
                onClick={() => setIsAddingCity(true)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-500"
                title="新增城市"
              >
                <Plus size={18} />
              </button>
              {currentCityId && (
                <button 
                  onClick={() => setCityToDelete(currentCityId)}
                  className="p-2 text-red-200 hover:text-red-400 transition-all"
                  title="刪除目前城市"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {cityToDelete && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl border-4 border-slate-100 space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-2">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-800">確定要刪除嗎？</h3>
                <p className="text-slate-500 font-medium italic">這會移除「{cities.find(c => c.id === cityToDelete)?.name}」口袋裡的所有餐廳喔！</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setCityToDelete(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all"
                >
                  先不要
                </button>
                <button 
                  onClick={() => {
                    deleteCity(cityToDelete);
                    setCityToDelete(null);
                  }}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 transition-all shadow-lg shadow-red-100"
                >
                  確定刪除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-yellow-50 p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] border-2 sm:border-4 border-yellow-100 shadow-inner space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-2xl sm:rounded-3xl shadow-md border-2 border-slate-100">
          <input 
            type="text" 
            value={newRestaurantName}
            onChange={(e) => setNewRestaurantName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addRestaurant()}
            placeholder="輸入餐廳名稱..."
            className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-300 text-sm sm:text-base"
          />
          <button 
            onClick={addRestaurant}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-orange-500 text-white rounded-[16px] sm:rounded-[20px] font-black hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-200"
          >
            <Plus size={24} strokeWidth={4} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {restaurants.map((r, i) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              key={r.id} 
              className={`flex items-center justify-between p-5 rounded-2xl border-2 shadow-sm transition-all ${
                ['bg-red-50 border-red-100 text-red-700', 'bg-blue-50 border-blue-100 text-blue-700', 'bg-teal-50 border-teal-100 text-teal-700', 'bg-pink-50 border-pink-100 text-pink-700'][i % 4]
              }`}
            >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center font-black text-xl">
                   {getFoodIcon(r.name)}
                 </div>
                 <span className="font-black text-lg">{r.name}</span>
              </div>
              <button 
                onClick={() => setRestaurants(restaurants.filter(item => item.id !== r.id))}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </motion.div>
          ))}
          {restaurants.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400 font-bold border-2 border-dashed border-yellow-200 rounded-3xl opacity-60">
               🌮 趕快加入一些美味選項吧！
            </div>
          )}
        </div>
      </div>

      <button 
        disabled={restaurants.length < 2}
        onClick={() => setStage('VOTERS')}
        className="w-full py-6 bg-orange-500 text-white rounded-[24px] text-2xl font-black flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale transition-all shadow-[0_8px_0_rgb(194,65,12)] active:translate-y-1 active:shadow-none"
      >
        設定投票家人 <ArrowRight size={28} strokeWidth={4} />
      </button>
    </motion.div>
  );

  const renderVoters = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6 sm:space-y-8"
    >
      <div className="text-left space-y-1 sm:space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">第二步：誰要參與？</h2>
        <p className="text-sm sm:text-base text-slate-500 font-medium italic">加入今天所有要一起吃晚餐的家人</p>
      </div>

      <div className="bg-blue-50 p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] border-2 sm:border-4 border-blue-100 shadow-inner space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-2xl sm:rounded-3xl shadow-md border-2 border-slate-100">
          <input 
            type="text" 
            value={newVoterName}
            onChange={(e) => setNewVoterName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addVoter()}
            placeholder="輸入家人暱稱..."
            className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-300 text-sm sm:text-base"
          />
          <button 
            onClick={addVoter}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-blue-500 text-white rounded-[16px] sm:rounded-[20px] font-black hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={24} strokeWidth={4} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {voters.map((v, i) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              key={v.id} 
              className="flex items-center justify-between p-5 bg-white rounded-2xl border-2 border-blue-100/50 shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black">
                   {String.fromCharCode(65 + i)}
                 </div>
                 <span className="font-black text-lg text-slate-700">{v.name}</span>
              </div>
              <button 
                onClick={() => setVoters(voters.filter(item => item.id !== v.id))}
                className="text-slate-300 hover:text-red-500 transition-colors p-2"
              >
                <Trash2 size={20} />
              </button>
            </motion.div>
          ))}
          {voters.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400 font-bold border-2 border-dashed border-blue-200 rounded-3xl opacity-60">
               👥 點擊上方加號把家人加進來吧！
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <button 
          onClick={() => setStage('SETUP')}
          className="flex-1 py-5 bg-white border-4 border-slate-100 text-slate-500 rounded-[24px] font-black text-xl hover:bg-slate-50 transition-all"
        >
          返回修改名單
        </button>
        <button 
          disabled={voters.length < 1}
          onClick={startVoting}
          className="flex-[2] py-5 bg-blue-600 text-white rounded-[24px] text-2xl font-black flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-[0_8px_0_rgb(29,78,216)] active:translate-y-1 active:shadow-none"
        >
          開始投票！ <Vote size={28} strokeWidth={4} />
        </button>
      </div>
    </motion.div>
  );

  const renderVoting = () => {
    const totalUsed = Object.values(currentVoter.votes).reduce((a: number, b: number) => a + (b as number), 0) as number;
    const remaining = TOTAL_VOTES_PER_PERSON - totalUsed;

    return (
      <motion.div 
        key={`voting-${currentVoter.id}`}
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl mx-auto space-y-6 sm:space-y-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 sm:gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800">分配你的 10 點心意</h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium italic">💡 點數越多代表越想吃</p>
          </div>
          <div className="bg-orange-50 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 border-orange-100 text-right min-w-[120px] sm:min-w-[140px] shadow-sm">
            <div className="text-3xl sm:text-4xl font-black text-orange-500">{remaining} / 10</div>
            <div className="text-[10px] sm:text-xs text-slate-400 font-black uppercase tracking-tighter">剩餘點數</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {shuffledIds.map((rid, i) => {
            const r = restaurants.find(res => res.id === rid);
            if (!r) return null;
            
            const colors = [
              'bg-yellow-50 border-yellow-100 hover:border-orange-300',
              'bg-blue-50 border-blue-100 hover:border-blue-300',
              'bg-teal-50 border-teal-100 hover:border-teal-300',
              'bg-pink-50 border-pink-100 hover:border-pink-300'
            ];
            const iconColors = ['bg-red-400', 'bg-yellow-400', 'bg-teal-400', 'bg-pink-400'];

            return (
              <div 
                key={r.id} 
                className={`${colors[i % colors.length]} p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] flex items-center justify-between border-2 sm:border-4 transition-all shadow-sm group`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`${iconColors[i % iconColors.length]} w-12 h-12 sm:w-16 h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform shrink-0`}>
                    <span className="text-2xl sm:text-3xl">{getFoodIcon(r.name)}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-xl font-black text-slate-800 truncate">{r.name}</h3>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-tight">候補 {i+1}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 bg-white p-1.5 sm:p-2 rounded-xl sm:rounded-2xl shadow-md shrink-0">
                  <button 
                    onClick={() => handleVoteChange(r.id, -1)}
                    disabled={(currentVoter.votes[r.id] || 0) <= 0}
                    className="w-8 h-8 sm:w-10 h-10 rounded-lg sm:rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-lg sm:text-xl hover:bg-slate-200 disabled:opacity-30 transition-all"
                  >
                    -
                  </button>
                  <span className="text-xl sm:text-2xl font-black w-6 sm:w-8 text-center text-slate-800">{(currentVoter.votes[r.id] || 0)}</span>
                  <button 
                    onClick={() => handleVoteChange(r.id, 1)}
                    disabled={remaining <= 0}
                    className="w-8 h-8 sm:w-10 h-10 rounded-lg sm:rounded-xl bg-orange-500 text-white flex items-center justify-center text-lg sm:text-xl font-bold hover:bg-orange-600 disabled:opacity-30 transition-all shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 sm:pt-6">
          <button 
            disabled={remaining > 0}
            onClick={finishVote}
            className="w-full py-4 sm:py-6 bg-orange-500 text-white rounded-[20px] sm:rounded-[24px] text-lg sm:text-2xl font-black flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 disabled:grayscale transition-all shadow-[0_4px_0_rgb(194,65,12)] sm:shadow-[0_8px_0_rgb(194,65,12)] active:translate-y-1 active:shadow-none"
          >
            {remaining > 0 ? `尚有 ${remaining} 票` : "送出加密投票 🔒"}
          </button>
        </div>
      </motion.div>
    );
  };

  const renderPassDevice = () => (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 text-center z-50 overflow-hidden"
    >
      {/* Decorative floating dots */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: Math.random() * 1000, opacity: 0 }}
            animate={{ y: [0, -100, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 10, repeat: Infinity, delay: Math.random() * 5 }}
            className="absolute rounded-full bg-orange-500"
            style={{ 
              width: Math.random() * 20 + 5 + 'px', 
              height: Math.random() * 20 + 5 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%'
            }}
          />
        ))}
      </div>

      <div className="max-w-sm space-y-10 relative">
        <div className="space-y-6">
          <div className="relative mx-auto w-32 h-32">
            <div className="absolute inset-0 bg-orange-500 rounded-[2.5rem] animate-ping opacity-20"></div>
            <div className="relative bg-orange-500 rounded-[2.5rem] w-full h-full flex items-center justify-center text-white shadow-2xl">
              <EyeOff size={56} strokeWidth={3} />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-white">秘密投票時間！</h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              為了公平起見，請把手機交給：
              <span className="text-3xl font-black text-orange-400 mt-4 block tracking-wider underline decoration-orange-500 underline-offset-8">
                {voters[currentVoterIndex + 1]?.name}
              </span>
            </p>
          </div>
        </div>
        
        <button 
          onClick={nextVoter}
          className="w-full py-6 bg-white text-slate-900 rounded-[24px] font-black text-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_8px_0_rgb(226,232,240)]"
        >
           我準備好投票了 <ArrowRight size={32} strokeWidth={4} />
        </button>
        
        <div className="flex items-center justify-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-xs">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          點擊上方按鈕後才會解鎖選項
        </div>
      </div>
    </motion.div>
  );

  const renderResults = () => {
    const winner = results[0];
    
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl mx-auto space-y-10"
      >
        <div className="text-center space-y-4 pt-4">
          <motion.div 
            initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="mx-auto w-32 h-32 bg-orange-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-[0_12px_0_rgb(194,65,12)] border-4 border-white mb-6"
          >
            <Trophy size={64} strokeWidth={3} />
          </motion.div>
          
          <div className="space-y-2">
            <p className="text-orange-500 font-black uppercase tracking-[0.2em] text-sm">最終優勝名單揭曉</p>
            <h1 className="text-6xl font-black text-slate-800 break-words leading-tight">{winner.name}</h1>
          </div>
          <div className="inline-block px-8 py-3 bg-teal-100 text-teal-700 rounded-full font-black text-lg">
             🎉 總計獲得 {winner.count} 票
          </div>
        </div>

        <div className="bg-slate-50 p-8 rounded-[40px] border-4 border-slate-100 space-y-6">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <History className="text-slate-400" size={24} strokeWidth={3} /> 全體投票統計
          </h3>
          <div className="space-y-6">
            {results.map((res, i) => (
              <div key={res.id} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-black ${i === 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                      {getFoodIcon(res.name)}
                    </span>
                    <span className={`text-xl font-bold ${i === 0 ? 'text-slate-900 underline decoration-orange-500 decoration-4 underline-offset-4' : 'text-slate-600'}`}>
                      {res.name}
                    </span>
                  </div>
                  <span className="font-black text-slate-400 text-lg">
                    {res.count} Pts
                  </span>
                </div>
                <div className="h-6 bg-white rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(res.count / (voters.length * 10)) * 100}%` }}
                    className={`h-full rounded-r-xl transition-all duration-1000 ${
                      i === 0 ? 'bg-orange-500 shadow-lg' : 
                      ['bg-blue-400', 'bg-teal-400', 'bg-pink-400'][i % 3] || 'bg-slate-300'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => setStage('SETUP')}
            className="py-5 bg-white border-4 border-slate-100 text-slate-500 rounded-[24px] font-black text-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
          >
            修改選項
          </button>
          <button 
            onClick={resetAll}
            className="py-5 bg-slate-800 text-white rounded-[24px] font-black text-xl hover:bg-slate-900 transition-all shadow-[0_8px_0_rgb(30,41,59)] active:translate-y-1 active:shadow-none flex items-center justify-center gap-3"
          >
            新一輪投票 <RefreshCw size={24} strokeWidth={3} />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-yellow-50 text-slate-800 font-sans p-4 sm:p-6 md:p-12 overflow-x-hidden">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 sm:mb-10 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-orange-500 p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl rotate-3">
             <Utensils className="w-6 h-6 sm:w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-800">晚餐吃什麼？</h1>
        </div>
        <div className="hidden md:flex gap-4">
          <div className="bg-white px-6 py-3 rounded-full shadow-sm border-2 border-yellow-200 flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full animate-pulse ${stage === 'RESULTS' ? 'bg-teal-400' : 'bg-green-400'}`}></span>
            <span className="font-bold text-slate-600">
              {stage === 'RESULTS' ? '投票已結束' : '投票進行中'}
            </span>
          </div>
        </div>
      </header>

      {/* Progress Section (Optional display of status) */}
      {voters.length > 0 && stage !== 'PASS_DEVICE' && stage !== 'SETUP' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-4xl mx-auto">
          {voters.map((v, i) => {
            const isActive = stage === 'VOTING' && currentVoterIndex === i;
            const isCompleted = v.hasVoted;
            
            if (isActive) {
              return (
                <div key={v.id} className="bg-orange-500 text-white p-4 rounded-3xl shadow-xl border-b-4 border-orange-700 scale-105 ring-4 ring-orange-200 flex flex-col items-center">
                  <div className="text-xs opacity-80 uppercase tracking-widest font-bold">Step {i + 1}</div>
                  <div className="font-black text-lg">換你投：{v.name}</div>
                </div>
              );
            }
            if (isCompleted) {
              return (
                <div key={v.id} className="bg-teal-500 text-white p-4 rounded-3xl shadow-md border-b-4 border-teal-700 flex flex-col items-center opacity-80">
                  <div className="text-xs opacity-80 uppercase tracking-widest font-bold">Step {i + 1}</div>
                  <div className="font-black">{v.name} (已投)</div>
                </div>
              );
            }
            return (
              <div key={v.id} className="bg-white text-slate-300 p-4 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center">
                <div className="text-xs uppercase tracking-widest font-bold">Step {i + 1}</div>
                <div className="font-bold text-slate-400">{v.name}</div>
              </div>
            );
          })}
        </div>
      )}

      <main className="relative max-w-4xl mx-auto bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl border-2 sm:border-4 border-slate-100 p-4 sm:p-8 md:p-12 min-h-[400px] sm:min-h-[500px]">
        <AnimatePresence mode="wait">
          {stage === 'SETUP' && renderSetup()}
          {stage === 'VOTERS' && renderVoters()}
          {stage === 'VOTING' && renderVoting()}
          {stage === 'RESULTS' && renderResults()}
        </AnimatePresence>
        
        {stage === 'PASS_DEVICE' && renderPassDevice()}
      </main>
      
      {/* Footer Info */}
      <footer className="mt-8 max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-400 text-sm gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-5 h-5 bg-teal-50 rounded-full">
            <CheckCircle2 size={14} className="text-teal-500" />
          </div>
          <span className="font-medium italic">已保護投票隱私：目前沒有人知道誰投給誰</span>
        </div>
        <div className="font-bold uppercase tracking-tighter">Family Dinner Decider v1.0</div>
      </footer>
    </div>
  );
}
