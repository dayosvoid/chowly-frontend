import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ShoppingBag, Clock3 } from 'lucide-react';
import { getMenuItems } from '../api/client';
import { useOrderSession } from '../context/OrderSessionContext';

export default function ChowlyMenu() {
  const navigate = useNavigate();
  const { session, registerMenuItems, addToCart, cartCount, cartTotal } = useOrderSession();

  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('food');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedItemStates, setAddedItemStates] = useState({});

  useEffect(() => {
    if (!session?.restaurantId) {
      navigate('/start');
      return;
    }

    getMenuItems(session.restaurantId)
      .then((data) => {
        setItems(data);
        registerMenuItems(data);
      })
      .catch(() => setError('Could not load the menu. Please try again.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.restaurantId]);

  const filteredItems = useMemo(
    () => items.filter((item) => item.type === activeTab),
    [items, activeTab]
  );

  const handleAddItem = (item) => {
    const id = item.id || item._id;
    addToCart(id);

    setAddedItemStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setAddedItemStates(prev => ({ ...prev, [id]: false }));
    }, 1000);
  };

  if (loading) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center font-body-md">
        <p className="text-on-surface-variant animate-pulse">Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center font-body-md">
        <p className="text-error font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body-md text-body-md selection:bg-primary-fixed">
      

      <main className="flex-1 flex flex-col relative w-full pt-20 pb-28 bg-surface">
        <div className="flex flex-col w-full">
          {/* Role & Category Navigation Hub */}
          <section className="px-screen-margin-mobile pt-gutter-sm pb-gutter-md">
            <div className="flex items-center justify-between mb-gutter-md">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">Artisanal Table-side</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Chef's Fresh Roster</h2>
              </div>
              <div className="flex items-center gap-gutter-xs bg-secondary-container px-gutter-sm py-1 rounded-full text-on-secondary-container">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <span className="font-label-sm text-label-sm">Kitchen Busy • ~15m</span>
              </div>
            </div>

            {/* Clean Food & Drinks Switching Tabs */}
            <div className="flex p-1 bg-surface-container rounded-full shadow-inner relative">
              <button 
                onClick={() => setActiveTab('food')}
                className={`flex-1 py-2.5 rounded-full font-label-md text-label-md flex items-center justify-center gap-gutter-xs transition-all duration-300 ${activeTab === 'food' ? 'bg-surface-container-lowest text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface'}`} 
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: activeTab === 'food' ? "'FILL' 1" : "'FILL' 0" }}>restaurant</span>
                <span>Food</span>
              </button>
              <button 
                onClick={() => setActiveTab('drink')}
                className={`flex-1 py-2.5 rounded-full font-label-md text-label-md flex items-center justify-center gap-gutter-xs transition-all duration-300 ${activeTab === 'drink' ? 'bg-surface-container-lowest text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface'}`} 
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: activeTab === 'drink' ? "'FILL' 1" : "'FILL' 0" }}>local_bar</span>
                <span>Drinks</span>
              </button>
            </div>
          </section>

          {/* Menu Item Cards Feed */}
          <section className="flex flex-col gap-gutter-md px-screen-margin-mobile pb-10">
            {filteredItems.map((item) => {
              const id = item.id || item._id;
              const isAdded = addedItemStates[id];
              return (
                <div key={id} className="bg-surface-container-lowest rounded-xl p-gutter-md shadow-[0_2px_12px_rgba(28,26,23,0.06)] flex gap-gutter-md items-center">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-low">
                    {item.imageUrl ? (
                      <img className="w-full h-full object-cover" src={item.imageUrl} alt={item.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-outline">
                        <span className="material-symbols-outlined text-[32px]">fastfood</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                    <div>
                      <div className="flex items-start justify-between gap-gutter-xs">
                        <h3 className="font-title-md text-title-md text-on-surface truncate">{item.name}</h3>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 mt-0.5">{item.description || 'Delicious freshly prepared item.'}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {item.avgPrepTimeMinutes && (
                          <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary bg-secondary-container/60 px-2 py-0.5 rounded-full">
                            <Clock3 size={14} />
                            {item.avgPrepTimeMinutes} mins
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-headline-sm text-headline-sm text-primary font-bold">₦{item.price?.toLocaleString()}</span>
                      <button 
                        onClick={() => handleAddItem(item)}
                        className={`flex items-center justify-center gap-1 h-10 px-4 rounded-xl text-on-primary font-label-md text-label-md active:scale-95 transition-all shadow-sm ${isAdded ? 'bg-secondary' : 'bg-primary hover:bg-primary-container'}`}
                      >
                        {isAdded ? (
                          <>
                            <span className="material-symbols-outlined text-[18px]">check</span>
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus size={18} />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-on-surface-variant font-body-md">
                No items in this category yet.
              </div>
            )}
          </section>

          {/* Floating Sticky Cart Capsule Bar */}
          {cartCount > 0 && (
            <aside className="sticky bottom-20 z-40 px-screen-margin-mobile pb-gutter-xs w-full max-w-lg mx-auto">
              <div className="w-full bg-inverse-surface text-inverse-on-surface rounded-2xl p-2.5 shadow-[0_12px_32px_rgba(28,26,23,0.28)] flex items-center justify-between transition-transform duration-200">
                <div className="flex items-center gap-gutter-sm pl-gutter-sm">
                  <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-primary text-on-primary shadow-sm">
                    <ShoppingBag size={20} />
                    <span className="absolute -top-1 -right-1 bg-surface-container-lowest text-primary text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">{cartCount}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-inverse-on-surface font-semibold tracking-tight">Cart • {cartCount} item{cartCount > 1 ? "s" : ""}</span>
                    <span className="font-headline-sm text-headline-sm text-primary-fixed-dim font-bold">₦{cartTotal?.toLocaleString()}</span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate("/cart")}
                  className="flex items-center gap-1.5 h-11 px-5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary-container active:scale-95 transition-all"
                >
                  <span>View Order</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </aside>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-screen-margin-mobile max-w-lg mx-auto">
          <button className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] transition-colors text-primary font-label-md font-bold">
            <span className="material-symbols-outlined text-[22px]">restaurant_menu</span>
            <span className="font-label-sm text-label-sm mt-0.5">Menu</span>
          </button>
          <button onClick={() => navigate('/cart')} className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] text-on-surface-variant transition-colors hover:text-on-surface">
            <span className="material-symbols-outlined text-[22px]">receipt_long</span>
            <span className="font-label-sm text-label-sm mt-0.5">Table Bill</span>
          </button>
          <button className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] text-on-surface-variant transition-colors hover:text-on-surface">
            <span className="material-symbols-outlined text-[22px]">room_service</span>
            <span className="font-label-sm text-label-sm mt-0.5">Service</span>
          </button>
          <button className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] text-on-surface-variant transition-colors hover:text-on-surface">
            <span className="material-symbols-outlined text-[22px]">table_restaurant</span>
            <span className="font-label-sm text-label-sm mt-0.5">Tables</span>
          </button>
        </div>
      </nav>
    </div>
  );
}