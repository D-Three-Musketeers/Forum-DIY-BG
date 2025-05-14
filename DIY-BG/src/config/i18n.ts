import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import external home translation files
import homeEn from "../locales/en/translation.json";
import homeBg from "../locales/bg/translation.json";

const resources = {
  en: {
    translation: {
      // Inline translations (hero)
      hero: {
        home: "Home",
        about: "About",
        welcome: "Welcome to DIY-BG Forum",
        searchPlaceholder: "Search...",
        createPost: "Create a post!",
        logout: "Log Out",
        login: "Log in",
        signup: "Sign up",
        loadingUser: "Loading user...",
      },
      // External loaded from file
      home: homeEn.home,
      create: homeEn.create,
      about: homeEn.about,
      detail: homeEn.detail,
    },
  },
  bg: {
    translation: {
      hero: {
        home: "Начало",
        about: "За нас",
        welcome: "Добре дошли във DIY-BG Форум",
        searchPlaceholder: "Търси...",
        createPost: "Създай пост!",
        logout: "Изход",
        login: "Вход",
        signup: "Регистрация",
        loadingUser: "Зареждане на потребителя...",
      },
      home: homeBg.home,
      create: homeBg.create,
      about: homeBg.about,
      detail: homeBg.detail,
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
