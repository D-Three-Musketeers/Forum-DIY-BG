import { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../state/App.context';
import { useNavigate } from 'react-router-dom';
import Hero from '../Hero';
import { db } from '../../config/firebase-config.ts';
import { ref, push } from 'firebase/database';


const LOCAL_STORAGE_TITLE_KEY = 'draftPostTitle'
const LOCAL_STORAGE_CONTENT_KEY = 'draftPostContent'

const Post_CreateView = () => {
    const { user , userData} = useContext(AppContext);
    const navigate = useNavigate();
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [posting, setPosting] = useState(false)


    // Load saved content from localStorage on component mount FOR TEXT SAVING
    useEffect(() => {
        const savedTitle = localStorage.getItem(LOCAL_STORAGE_TITLE_KEY)
        const savedContent = localStorage.getItem(LOCAL_STORAGE_CONTENT_KEY)

        if (savedTitle) {
            setTitle(savedTitle)
        }
        if (savedContent) {
            setContent(savedContent)
        }
    }, []);

    /**
  * @function handleTitleChange : Save every typed letter, while typing to the LocalStorage
  * @function handleContentChange : Save every typed letter, while typing to the LocalStorage
  * These functions, prevent loosing what user wrote, if he refreshes the page
  */
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value
        setTitle(newTitle)
        localStorage.setItem(LOCAL_STORAGE_TITLE_KEY, newTitle)
    }
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value
        setContent(newContent)
        localStorage.setItem(LOCAL_STORAGE_CONTENT_KEY, newContent)
    }


    /**
     * @function handlePost : handles creating a post (button Post)
     */
    const handlePost = async () => {
        if (!user) {
            alert('You must be logged in to create a post.')
            return
        }
        if (title.length < 16 || title.length > 64 || content.length < 32 || content.length > 8192) {
            alert('Please ensure your title and content meet the length requirements.')
            return
        }

        setPosting(true);
        try {
            const postsRef = ref(db, 'posts'); // Reference to the 'posts' node
            const newPost = {
                userId: user.uid,
                handle:userData.handle,
                title: title,
                content: content,
                timestamp: new Date().toISOString(),
                // ADD more fields here later ( likes, comments count)
            }

            await push(postsRef, newPost) // Push the new post data to Firebase

            setTitle('')
            setContent('')
            localStorage.removeItem(LOCAL_STORAGE_TITLE_KEY)
            localStorage.removeItem(LOCAL_STORAGE_CONTENT_KEY)
            navigate('/home')

        } catch (error: any) {
            console.error('Error saving post to Firebase:', error)
            alert('Failed to save post. Please try again.')
        } finally {
            setPosting(false)
        }
    }

    /**
     * @function handleAbort : handles cancelling, when creating a post (button Abort)
     */
    const handleAbort = () => {
        if (window.confirm('Are you sure you want to cancel creating this post?')) {
            setTitle('')
            setContent('')
            // Clear localStorage on abort
            localStorage.removeItem(LOCAL_STORAGE_TITLE_KEY)
            localStorage.removeItem(LOCAL_STORAGE_CONTENT_KEY)
            navigate('/create-post')
        }
    }


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
                        maxWidth: "700px",
                        backgroundColor: "#f8f9fa",
                        marginBottom: '120px'
                    }}
                >
                    <div className="card-body">
                        <h3 className="card-title text-center mb-4">Create a New Post</h3>

                        <div className="mb-3">
                            <label htmlFor="postTitle" className="form-label">
                                Title
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                id="postTitle"
                                placeholder="Name your topic"
                                value={title}
                                onChange={handleTitleChange}
                            />
                            {title.length < 16 || title.length > 64 ? (
                                <div className="form-text text-danger">Title must be between 16 and 64 characters.</div>
                            ) : (
                                <div className="form-text text-success">Title length is valid.</div>
                            )}
                        </div>

                        <div className="mb-3">
                            <label htmlFor="postContent" className="form-label">
                                Content
                            </label>
                            <textarea
                                className="form-control"
                                id="postContent"
                                rows={8}
                                placeholder="Write the content of your post"
                                value={content}
                                onChange={handleContentChange}
                            />
                            {content.length < 32 || content.length > 8192 ? (
                                <div className="form-text text-danger">Content must be between 32 and 8192 characters.</div>
                            ) : (
                                <div className="form-text text-success">Content length is valid.</div>
                            )}
                        </div>

                        <div className="d-flex justify-content-between">
                            <button
                                className="btn btn-primary"
                                onClick={handlePost}
                                disabled={posting || title.length < 16 || title.length > 64 || content.length < 32 || content.length > 8192 || !user}
                            >
                                {posting ? 'Posting...' : 'Post'}
                            </button>
                            <button className="btn btn-secondary" onClick={handleAbort}>
                                Abort
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Post_CreateView;