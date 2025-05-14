import { useTranslation } from "react-i18next";
import enFlag from "../assets/flags/gb.svg";
import bgFlag from "../assets/flags/bg.svg";

const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === "en" ? "bg" : "en");
  };

  const currentFlag = i18n.language === "en" ? enFlag : bgFlag;
  const currentLabel = i18n.language === "en" ? "English" : "Български";

  return (
    <button
      onClick={toggleLang}
      className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
      style={{
        fontSize: "12px",
        padding: "4px 8px",
        lineHeight: "1",
        marginRight: "6px",
        marginTop: "2px",
        borderRadius: "6px",
      }}
      title="Toggle Language"
    >
      <img
        src={currentFlag}
        alt="Flag"
        style={{ width: "16px", height: "16px", objectFit: "cover" }}
      />
      <span>{currentLabel}</span>
    </button>
  );
};

export default LanguageToggle;
