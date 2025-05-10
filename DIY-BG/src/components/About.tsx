import Hero from "./Hero";

const About = () => {
  return (
    <div
      style={{ backgroundColor: "#12263a", minHeight: "100vh", color: "white" }}
    >
      <Hero />

      <div className="container py-5">
        <h2 className="fw-bold text-center mb-4 text-white">
          About DIY-BG Forum
        </h2>

        <p className="lead text-white-50 text-center mb-5">
          Welcome to <strong>DIY-BG Forum</strong> – a community dedicated to
          all things
          <span className="text-success fw-semibold"> Do It Yourself</span>,
          proudly built in and for Bulgaria.
        </p>

        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="bg-dark rounded p-4 border border-success-subtle">
              <h4 className="text-success mb-3">Forum Vision</h4>
              <p>
                DIY-BG Forum is a place where you can explore, search, and read
                posts and comments from passionate DIY enthusiasts — from
                woodworking and electronics, to home hacks and crafts. Whether
                you’re fixing a faucet or 3D printing custom parts, you’re in
                the right place.
              </p>

              <h4 className="text-success mt-4 mb-3">Access & Membership</h4>
              <ul>
                <li>
                  ✅ Guests can browse posts, use the search bar, and read
                  comments freely.
                </li>
                <li>
                  🔐 To write posts or comments, you need to create a free user
                  account.
                </li>
                <li>
                  🧑‍💻 Registered users can also update their profile picture and
                  display name.
                </li>
                <li>
                  🔁 Users can log in and out securely using Firebase
                  authentication.
                </li>
              </ul>

              <h4 className="text-success mt-4 mb-3">Moderation & Safety</h4>
              <p>
                Our forum is moderated by <strong>admins</strong> to ensure a
                respectful and productive environment. Inappropriate content or
                spam will be removed, and users may be banned if necessary to
                protect the community.
              </p>

              <h4 className="text-success mt-4 mb-3">Languages</h4>
              <p>
                The platform will support <strong>English</strong> and{" "}
                <strong>Bulgarian</strong>. Users will soon be able to switch
                languages from the settings panel.
              </p>

              <p className="text-center mt-5">
                ✨ Whether you're a beginner or an expert, we’re happy to have
                you in our DIY family!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
