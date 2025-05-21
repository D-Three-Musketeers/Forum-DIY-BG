import Hero from "./Hero";
import { useTranslation, Trans } from "react-i18next";

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="app-page-content" style={{ minHeight: "100vh" }}>
      <Hero />

      <div className="container py-5">
        <h2 className="fw-bold text-center mb-4 text-white">
          {t("about.title")}
        </h2>

        <p className="lead text-white-50 text-center mb-5">
          <Trans
            i18nKey="about.intro"
            components={{
              strong: <strong />,
              span: <span className="text-success fw-semibold" />,
            }}
          />
        </p>

        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="bg-dark rounded p-4 border border-success-subtle">
              <h4 className="text-success mb-3">{t("about.visionTitle")}</h4>
              <p>{t("about.visionText")}</p>

              <h4 className="text-success mt-4 mb-3">
                {t("about.accessTitle")}
              </h4>
              <ul>
                <li>{t("about.accessGuests")}</li>
                <li>{t("about.accessRegistered")}</li>
                <li>{t("about.accessProfile")}</li>
                <li>{t("about.accessLogin")}</li>
              </ul>

              <h4 className="text-success mt-4 mb-3">
                {t("about.moderationTitle")}
              </h4>
              <p>
                <Trans
                  i18nKey="about.moderationText"
                  components={{ strong: <strong /> }}
                />
              </p>

              <h4 className="text-success mt-4 mb-3">
                {t("about.languagesTitle")}
              </h4>
              <p>
                <Trans
                  i18nKey="about.languagesText"
                  components={{ strong: <strong /> }}
                />
              </p>

              <p className="text-center mt-5">{t("about.outro")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
