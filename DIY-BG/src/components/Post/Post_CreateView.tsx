import { useContext } from 'react';
import { AppContext } from '../../state/App.context';
import { useNavigate } from 'react-router-dom';
import Hero from '../Hero';


const Post_CreateView = () => {
    const { user } = useContext(AppContext);
    const navigate = useNavigate();

    /**
     * If the user is not logged in!
     */
    if (!user) {
        return (
            <>
                <Hero />
                <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
                    <div
                        className="card p-4 shadow"
                        style={{
                            width: "100%",
                            maxWidth: "500px",
                            backgroundColor: "#f8f9fa",
                            textAlign: 'center',
                            marginBottom: '500px',
                        }}
                    >
                        <div className="card-body">
                            <p style={{ fontSize: '1.1rem', marginBottom: '4px' }}>
                                To create a post, you must{' '}
                                <span className="clickable-link" onClick={() => navigate('/loginpage')}>
                                    log into your account!
                                </span>
                            </p>
                            <p style={{ fontSize: '1rem' }}>
                                You don't have an account yet?{' '}
                                <span className="clickable-link" onClick={() => navigate('/signinpage')}>
                                    Register here!
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    /**
      * If the user is logged in, render the actual create post form here
      */
    return (
        <>
            <Hero />
            <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
                <div
                    className="card p-4 shadow"
                    style={{
                        width: "100%",
                        maxWidth: "500px",
                        backgroundColor: "#f8f9fa",
                        marginBottom: '500px',
                    }}
                >
                    <div className="card-body">
                        <h2 className="card-title text-center mb-4">Create a New Post</h2>
                        {/* Add your create post form elements here */}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Post_CreateView;