import Hero from "./Hero";
import { useContext,useState,useEffect} from "react";
import { AppContext } from "../state/App.context";
import { updateEmail } from "firebase/auth";
import { auth } from "../config/firebase-config";
import { useParams } from "react-router";
import { EmailAuthProvider,reauthenticateWithCredential} from "firebase/auth/web-extension";

const User = () => {
  const {uid} = useParams();
  const [editing , setEditing] = useState(false);
  const [email , setEmail] = useState('');
  const { user, userData } = useContext(AppContext);

  useEffect(() => {
    if(user?.uid ===uid) {
      if (user && user.email) {
        setEmail(user.email);
      }
    }
  },[uid,user]);

  const handleEmailChange = async () => {
    if (auth.currentUser && user?.email) {
      try {
        const password = prompt("Enter your current password:");
        if (!password) return;
  
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);
  
        // Now that user is re-authenticated, try to update email
        await updateEmail(auth.currentUser, email);
  
        alert("Email updated. Please verify your new email address.");
      } catch (error: any) {
        console.error("Error updating email:", error.message);
        alert(error.message);
      }
    }
  };

  if (!user || user.uid !== uid) return <p>Unauthorized or user not found</p>;
  console.log(userData)
  console.log(user)
  return (
    <div className="container-fluid p-0">
    <Hero />
    <div className="row justify-content-center py-5">
      <div className="col-md-6 col-lg-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="text-center mb-4">User Information</h2>
            <div className="mb-3">
              <strong>First Name:</strong> {userData?.firstName}
            </div>
            <div className="mb-3">
              <strong>Last Name:</strong> {userData?.lastName}
            </div>
            <div className="mb-3">
              <strong>Role:</strong> {userData?.admin ? "Admin" : "User"}
            </div>

            <div className="mb-4">
              <strong>Email:</strong>
              <div className="input-group mt-2">
                {editing ? (
                  <>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="input-group-append">
                      <button className="btn btn-primary" onClick={handleEmailChange}>Save</button>
                      <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="form-control">{user.email}</span>
                    <button className="btn btn-warning mt-2" onClick={() => setEditing(true)}>Edit</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
};

export default User;
