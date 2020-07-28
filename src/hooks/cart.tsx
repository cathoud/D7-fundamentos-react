import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const loadedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (loadedProducts) setProducts(JSON.parse(loadedProducts));
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(p => p.id === product.id);

      let newProducts = [];

      if (productExists) {
        newProducts = products.map(p =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p,
        );
      } else {
        newProducts = [...products, { ...product, quantity: 1 }];
      }

      setProducts(newProducts);
      await AsyncStorage.setItem(
        `@GoMarketplace:products`,
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(p =>
          p.id === id ? { ...p, quantity: p.quantity + 1 } : p,
        ),
      );

      await AsyncStorage.setItem(
        `@GoMarketplace:products`,
        JSON.stringify(products),
      );
      // TODO INCREMENTS A PRODUCT QUANTITY IN THE CART
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const { quantity, ...rest } =
        products.find(product => product.id === id) || ({} as Product);

      let newProducts = [];
      if (quantity === 1) {
        newProducts = products.filter(product => product.id !== id);
      } else {
        newProducts = products.map(product =>
          product.id === id ? { ...rest, quantity: quantity - 1 } : product,
        );
      }
      setProducts(newProducts);
      await AsyncStorage.setItem(
        `@GoMarketplace:products`,
        JSON.stringify(products),
      );
    },
    [products],
    // TODO DECREMENTS A PRODUCT QUANTITY IN THE CART
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
