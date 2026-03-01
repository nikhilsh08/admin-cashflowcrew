// @/_authContext/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { adminSlice } from "./slice";

export const store = configureStore({
  reducer: {
    admin: adminSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;