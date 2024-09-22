// i18n.js
import i18next from "./i18next@23.15.1.js";
import HttpBackend from "./i18next-http-backend@2.6.1.js";
import LanguageDetector from "./i18next-browser-languagedetector@8.0.0.js";

i18next
  .use(HttpBackend)
  .use(LanguageDetector)
  .init({
    supportedLngs: ["en", "zh"],
    fallbackLng: "en",
    debug: false,
    backend: {
      loadPath: "/locales/{{lng}}/translation.json",
    },
  });

export default i18next;
