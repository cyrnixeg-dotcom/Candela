import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  subcategory: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const existing = get().items.find((i) => i.id === item.id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: 1 }] });
        }
        // Auto-open cart
        set({ isOpen: true });
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "candela-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// UI State store
interface UIStore {
  isChatOpen: boolean;
  isSearchOpen: boolean;
  selectedProduct: string | null;
  activeCategory: string;
  openChat: () => void;
  closeChat: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  setSelectedProduct: (id: string | null) => void;
  setActiveCategory: (cat: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isChatOpen: false,
  isSearchOpen: false,
  selectedProduct: null,
  activeCategory: "all",

  openChat: () => set({ isChatOpen: true }),
  closeChat: () => set({ isChatOpen: false }),
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  setSelectedProduct: (id) => set({ selectedProduct: id }),
  setActiveCategory: (cat) => set({ activeCategory: cat }),
}));

// Global Settings Store
export interface SiteSettings {
  phone: string;
  whatsapp: string;
  store_name: string;
  tagline: string;
  about: string;
  instagram: string;
  currency: string;
  delivery_note: string;
}

interface SettingsStore {
  settings: SiteSettings;
  loaded: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SiteSettings>) => void;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  phone: "+20 100 000 0000",
  whatsapp: "+20 100 000 0000",
  store_name: "CANDELA",
  tagline: "Your Feminine Scent",
  about: "CANDELA is a premium feminine fragrance and lifestyle brand crafted for the woman who celebrates herself every day. From luxurious body mists to artisan candles, every product is a sensory experience.",
  instagram: "@candela.official",
  currency: "EGP",
  delivery_note: "We will contact you within 24 hours to confirm your order and arrange delivery.",
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_SITE_SETTINGS,
  loaded: false,
  fetchSettings: async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        set({ settings: { ...DEFAULT_SITE_SETTINGS, ...data }, loaded: true });
      }
    } catch {
      // keep defaults
    }
  },
  updateSettings: (newSettings) =>
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),
}));
