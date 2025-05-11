import { useState ,useContext} from "react";
import { loginUser } from "../services/auth.service";
import Hero from "./Hero";
import { useNavigate } from "react-router";
import { AppContext } from "../state/App.context";
import { getUserData } from "../services/users.service";

const LogInPage = () => {
  const navigate = useNavigate();
  const [user , setUser] = useState({
    email:'',
    password:'',
  });
  const [loading,setLoading]=useState(false);
  const [error,setError] = useState('');
  const {setAppState} = useContext(AppContext);

  const login = async() => {
    if(!user.email || !user.password){
      return alert('Please enter all fields!')
    }
    setLoading(true);
    setError('');
    try {
      const credentials = await loginUser(user.email , user.password);
      const uid = credentials.user.uid;
      const rawData = await getUserData(uid);
      const userData = rawData ? Object.values(rawData)[0] : null;
      setAppState({
        user: credentials.user,
        userData: userData,
      });
      navigate('/home');
    }catch(error:any){
      console.error(error.message)
      setError(error.message);
    }finally{
      setLoading(false);
    }
  }

  const updateUser = (prop: keyof typeof user) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUser({
        ...user,
        [prop]: e.target.value,
      });
    };
  return (
    <>
    <Hero></Hero>
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      
      <div
        className="card p-4 shadow"
        style={{
          width: "100%",
          maxWidth: "500px",
          backgroundColor: "#f8f9fa",
        }}
      >
        <div className="card-body">
          <h2 className="card-title text-center mb-4">Log In</h2>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="loginEmail" className="form-label">
              Email
            </label>
            <input
              id="loginEmail"
              type="email"
              className="form-control"
              placeholder="Enter email..."
              value={user.email}
              onChange={updateUser("email")}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="loginPassword" className="form-label">
              Password
            </label>
            <input
              id="loginPassword"
              type="password"
              className="form-control"
              placeholder="Enter password..."
              value={user.password}
              onChange={updateUser("password")}
            />
          </div>

          <button
            className="btn btn-primary w-100 py-2"
            onClick={login}
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Logging in...
              </>
            ) : (
              "Log In"
            )}
          </button>

          <div className="mt-3 text-center">
            <p className="mb-0">
              Don't have an account?{" "}
              <a href="/signinpage" className="text-primary">
                Register here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
    
  );
};

export default LogInPage;
