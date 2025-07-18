// File: app/context/NavigationContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

type State = {
  history: string[];
  index: number;
};

type Action =
  | { type: "push"; path: string }
  | { type: "back" }
  | { type: "forward" };

function navReducer(state: State, action: Action): State {
  switch (action.type) {
    case "push":
      // if we’re already at this path, no-op
      if (state.history[state.index] === action.path) {
        return state;
      }
      // otherwise drop any “forward” entries, append the new one,
      // and move index to the end
      const newHist = state.history
        .slice(0, state.index + 1)
        .concat(action.path);
      return { history: newHist, index: newHist.length - 1 };

    case "back":
      if (state.index > 0) {
        return { ...state, index: state.index - 1 };
      }
      return state;

    case "forward":
      if (state.index < state.history.length - 1) {
        return { ...state, index: state.index + 1 };
      }
      return state;

    default:
      return state;
  }
}

interface NavContext {
  canGoBack: boolean;
  canGoForward: boolean;
  back: () => void;
  forward: () => void;
}

const NavigationContext = createContext<NavContext | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [{ history, index }, dispatch] = useReducer(navReducer, {
    history: [],
    index: -1,
  });

  // every time the path changes, push it into our reducer
  useEffect(() => {
    dispatch({ type: "push", path: pathname });
  }, [pathname]);

  const back = () => {
    if (index > 0) {
      const to = history[index - 1];
      router.push(to);
      dispatch({ type: "back" });
    }
  };

  const forward = () => {
    if (index < history.length - 1) {
      const to = history[index + 1];
      router.push(to);
      dispatch({ type: "forward" });
    }
  };

  return (
    <NavigationContext.Provider
      value={{
        canGoBack: index > 0,
        canGoForward: index < history.length - 1,
        back,
        forward,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigation must be used inside NavigationProvider");
  }
  return ctx;
}
