import * as Localization from "expo-localization";
import i18n from "i18n-js";

import en from "./locales/en.json";
import fr from "./locales/fr.json";

i18n.fallbacks = true;
i18n.translations = { en, fr };
i18n.locale = Localization.locale;

export default i18n;
