//assets
import "./Help.page.scss";
import HomeButton from "$components/HomeButton";
import useTitle from "$hooks/useTitle";
import { Link } from "react-router-dom";

const Help = () => {
    useTitle("ksq - info");

    return (
        <div id="helpPage" className="page help">
            <HomeButton />
            <h1>Info</h1>

            <div className="content">
                <h2>
                    What is <u>Klugscheißer-Quiz</u>?
                </h2>
                <p>
                    Klugscheißer-Quiz (german for <i>Smartass-Quiz</i>) is my
                    version of the American game show{" "}
                    <a href="https://en.wikipedia.org/wiki/Jeopardy!">
                        Jeopardy!
                    </a>
                    .
                    <blockquote cite="https://en.wikipedia.org/wiki/Jeopardy!">
                        [...] The show is a quiz competition that reverses the
                        traditional question-and-answer format of many quiz
                        shows. Rather than being given questions, contestants
                        are instead given general knowledge clues in the form of
                        answers and they must identify the person, place, thing,
                        or idea that the clue describes, phrasing each response
                        in the form of a question. [...]
                        <small>~ Wikipedia</small>
                    </blockquote>
                </p>
                <h2>What does this website do?</h2>
                <p>
                    On my website you can create your own Jeopardy games and
                    more. You can use text, images, sounds and videos as
                    questions and answers. Just import your media into the{" "}
                    <Link to={"/categories/editor"}>Category-Editor</Link> and
                    use it right away.
                    <br />
                    To play a game, grab a couple of friends, create teams and
                    select at least one of your created categories. Your 1 - 9
                    Key work as buzzers for each team, though i recommend using
                    any form of gamepad as buzzers (
                    <a href="https://www.google.com/search?q=playstation+buzzers">
                        my recommendation
                    </a>
                    ).
                    <br />
                    <br />
                    To use Gamepads as buzzers, press any knob on your gamepad
                    and a button will appear at the bottom left of the game
                    page. From there you can configure which button / gamepad
                    serves as a buzzer for wich team.
                    <br />
                    <br />
                    Create Boards to quickly setup a collection of categories
                </p>
                <h2>Where is my data stored?</h2>
                <p>
                    Everything is stored in the browser, meaning no data leaves
                    your computer. This is convenient as you dont need an
                    internet connection to play the game or use the website at
                    all.
                </p>

                <h2>Other things</h2>
                <p>
                    This project is open source, please leave feedback and star
                    this repo on{" "}
                    <a
                        href="https://github.com/NilsGke/klugscheisser-quiz"
                        target="_blank"
                    >
                        GitHub
                    </a>
                    .
                </p>
            </div>
        </div>
    );
};

export default Help;
