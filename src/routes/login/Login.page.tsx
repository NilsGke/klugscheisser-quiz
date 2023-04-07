import { useCallback, useEffect, useRef, useState } from "react";
import google from "../../assets/google.svg";
import { signInWithGoogle } from "../../firebase/auth/google";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-simple-toasts";
import "./Login.scss";
import autoAnimate from "@formkit/auto-animate";
import { register, resetPassword, signIn } from "../../firebase/auth/auth";
import { UserData } from "../../firebase/firestore/user";
import HomeButton from "../../components/HomeButton";

const lowercaseRegex = /(?=.*[a-z])/;
const uppercaseRegex = /(?=.*[A-Z])/;
const digitRegex = /(?=.*\d)/;
const specialCharRegex = /(?=.*[@$!%*?&])/;
const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const emailRegex =
    /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-]+)(\.[a-zA-Z]{2,5}){1,2}$/;

enum Action {
    SignUp = "CreateAccount",
    Login = "Login",
    ResetPassword = "ResetPassword",
}
type formDetails = {
    email: UserData["email"];
    username: UserData["username"];
    pass: string;
    passRep: string;
};

const Login = ({ loggedIn }: { loggedIn: boolean }) => {
    let { state } = useLocation();
    const [action, setAction] = useState<Action>(
        ((state?.createAccount ?? true) as boolean)
            ? Action.SignUp
            : Action.Login
    );

    const [formData, setFormData] = useState<formDetails>({
        email: "",
        username: "",
        pass: "",
        passRep: "",
    });

    const navigate = useNavigate();

    const containerRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (containerRef.current) autoAnimate(containerRef.current);
    }, []);

    useEffect(() => {
        if (loggedIn) {
            toast("logged in");
            navigate("/");
        }
    });

    const submit = useCallback(() => {
        if (action === Action.Login) login(formData);
        else if (action === Action.SignUp) signUp(formData);
        else if (action === Action.ResetPassword)
            resetPassword(formData.email).then(() =>
                toast("recovery Email sent!")
            );
    }, [formData]);

    const signUp = (form: formDetails) => {
        // #region validation
        if (form.email === "") return toast("please enter an email");
        else if (
            !/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-]+)(\.[a-zA-Z]{2,5}){1,2}$/.test(
                form.email
            )
        )
            return toast("please enter a valid email address");
        else if (!passwordRegex.test(form.pass)) {
            if (!lowercaseRegex.test(form.pass))
                return toast(
                    "Password must contain at least one lowercase letter"
                );
            else if (!uppercaseRegex.test(form.pass))
                return toast(
                    "Password must contain at least one uppercase letter"
                );
            else if (!digitRegex.test(form.pass))
                return toast(
                    "Password must contain at least one numeric digit"
                );
            else if (!specialCharRegex.test(form.pass))
                return toast(
                    "Password must contain at least one special character (@$!%*?&)"
                );
            else if (form.pass.length < 8)
                return toast("Password must be at least 8 characters long.\n");
        } else if (form.pass !== form.passRep)
            return toast("password must match");
        // #endregion

        register(form.email, form.pass, form.passRep, form.username).then(
            (user) => toast("welcome!")
        );
    };

    const login = (form: formDetails) => {
        if (form.email === "") return toast("please enter your email");
        else if (!emailRegex.test(form.email))
            return toast("please enter a valid email address");
        else if (form.pass === "") return toast("please enter your password");

        signIn(form.email, form.pass);
    };

    return (
        <div id="loginPage">
            <div className="container">
                <HomeButton />
                <h1>
                    {action === Action.SignUp
                        ? "signUp"
                        : action === Action.ResetPassword
                        ? "Reset Password"
                        : "login"}
                </h1>
                <form onSubmit={(e) => e.preventDefault()} ref={containerRef}>
                    {action === Action.ResetPassword ? (
                        <>
                            <label htmlFor="emailInput">
                                Email
                                <input
                                    type="email"
                                    name="emailInput"
                                    id="emailInput"
                                    value={formData.email}
                                    autoComplete="email"
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            email: e.target.value,
                                        }))
                                    }
                                />
                            </label>
                        </>
                    ) : (
                        <>
                            <label htmlFor="emailInput">
                                Email
                                <input
                                    type="email"
                                    name="emailInput"
                                    id="emailInput"
                                    value={formData.email}
                                    autoComplete="email"
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            email: e.target.value,
                                        }))
                                    }
                                />
                            </label>

                            {action === Action.SignUp ? (
                                <label htmlFor="nameInput">
                                    Username
                                    <input
                                        type="text"
                                        name="nameInput"
                                        id="nameInput"
                                        value={formData.username}
                                        autoComplete="username"
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                username: e.target.value,
                                            }))
                                        }
                                    />
                                </label>
                            ) : null}
                            <label htmlFor="passInput">
                                Password
                                <input
                                    type="password"
                                    name="password"
                                    id="passInput"
                                    value={formData.pass}
                                    autoComplete={
                                        action === Action.SignUp
                                            ? "new-password"
                                            : "current-password"
                                    }
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            pass: e.target.value,
                                        }))
                                    }
                                />
                            </label>
                            {action === Action.SignUp ? (
                                <label htmlFor="passRepeat">
                                    Repeat Password
                                    <input
                                        type="password"
                                        name="passwordRepeat"
                                        id="passRepeat"
                                        value={formData.passRep}
                                        autoComplete="new-password"
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                passRep: e.target.value,
                                            }))
                                        }
                                    />
                                </label>
                            ) : null}
                        </>
                    )}
                    <button className="submit" onClick={submit}>
                        {action === Action.SignUp
                            ? "sign up 🚀"
                            : action === Action.ResetPassword
                            ? "send Recovery Email 📫"
                            : "login 💫"}
                    </button>
                </form>

                <div className="bottomButtons">
                    {action !== Action.ResetPassword ? (
                        <button
                            className="switchMode"
                            onClick={() =>
                                setAction((prev) =>
                                    prev === Action.SignUp
                                        ? Action.Login
                                        : Action.SignUp
                                )
                            }
                        >
                            {action === Action.SignUp
                                ? "I already have an account 👋"
                                : "I am new here 🙋"}
                        </button>
                    ) : null}
                    <button
                        className="switchMode"
                        onClick={() =>
                            setAction((prev) =>
                                prev !== Action.ResetPassword
                                    ? Action.ResetPassword
                                    : Action.Login
                            )
                        }
                    >
                        {action === Action.ResetPassword
                            ? "I know my password 🙂"
                            : "I forgot my password 😅"}
                    </button>
                </div>

                <div className="authProviders">
                    <button onClick={signInWithGoogle}>
                        <img src={google} alt="" />
                    </button>
                </div>
            </div>
            {/* div.resetPassword>h2{Reset Password}+input:email+button.submit */}
        </div>
    );
};

export default Login;
