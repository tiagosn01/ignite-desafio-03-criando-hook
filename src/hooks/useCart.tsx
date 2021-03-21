import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });


  const addProduct = async (productId: number) => {
    try {
      const response = await api.get<Stock>('/stock/' + productId)
      const stock = response.data;

    
      let product = cart.find((productItem) => productItem.id === productId);
      if (product) {
        if (product.amount < stock.amount) {
         
          const newProduct = cart.map((item) => (
            item.id === productId ? {
              ...item,
              amount: item.amount + 1,
            } : item))

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProduct))
          setCart(newProduct)
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        const response = await api.get<Product>('/products/' + productId);
        const product = response.data;
        if (stock.amount < 1) {
          toast.error('Quantidade solicitada fora de estoque');
        } else {
          product.amount = 1;
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, product]))
          setCart([...cart, product])
        }
      }
    } catch {  
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      let products = [...cart];
      let productIndex = products.findIndex((product) => product.id === productId);
      if (productIndex > -1) {
        products.splice(productIndex, 1);
        
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(products))
        setCart(products)
        
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {  
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
      
      let product = cart.find((product) => product.id === productId);
      if (product) {
        const response = await api.get<Stock>('/stock/' + productId)
        const stock = response.data;
        if (amount <= stock.amount) {
          
          const newProduct = cart.map((item) => (
            item.id === productId ? {
              ...item,
              amount: amount,
            } : item))

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProduct))
          setCart(newProduct)
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        toast.error('Erro na alteração de quantidade do produto');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };


  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
