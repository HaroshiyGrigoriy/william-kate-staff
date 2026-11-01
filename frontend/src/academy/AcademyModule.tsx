import { useEffect, useRef, useState } from "react";
import { scenes } from "./content.ts";
import {
  acknowledge,
  completedScenes,
  decide,
  detail,
  fresh,
  parseProgress,
  position,
  STORAGE_KEY,
} from "./progress.ts";
import type { Progress } from "./progress.ts";
const route = () =>
  ["#play", "#results"].includes(window.location.hash)
    ? window.location.hash
    : "#module";
function load() {
  try {
    return {
      progress: parseProgress(localStorage.getItem(STORAGE_KEY)),
      warning: "",
    };
  } catch {
    return {
      progress: fresh(),
      warning:
        "Сохранение недоступно или повреждено. Можно пройти модуль в этой вкладке. Для нового сохранения нажми «Повторить сохранение».",
    };
  }
}
export function AcademyModule({ learnerId = "local" }: { learnerId?: string }) {
  // A host may pass a stable, non-secret learner identifier after its own authentication.
  const key =
    learnerId === "local"
      ? STORAGE_KEY
      : `${STORAGE_KEY}:${encodeURIComponent(learnerId)}`;
  const [initial] = useState(() =>
    learnerId === "local"
      ? load()
      : (() => {
          try {
            return {
              progress: parseProgress(localStorage.getItem(key)),
              warning: "",
            };
          } catch {
            return {
              progress: fresh(),
              warning:
                "Не удалось прочитать сохранение. Модуль работает в этой вкладке.",
            };
          }
        })(),
  );
  const [progress, setProgress] = useState<Progress>(initial.progress);
  const [warning, setWarning] = useState(initial.warning);
  const [page, setPage] = useState(route);
  const [confirmReset, setConfirmReset] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const completed = completedScenes(progress);
  const pending =
    progress.decisions.length > progress.acknowledged
      ? detail(progress.decisions.at(-1)!)
      : null;
  const pos = position(progress);
  const activeScene = pending?.scene ?? scenes[pos.index];
  const activeNode = activeScene?.nodes.find((n) => n.id === pos.nodeId)!;
  useEffect(() => {
    const onHash = () => setPage(route());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    if (warning) return;
    try {
      localStorage.setItem(key, JSON.stringify(progress));
    } catch {
      setWarning(
        "Браузер не разрешил сохранить прогресс. Он останется только в этой вкладке, пока она открыта.",
      );
    }
  }, [progress, key, warning]);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page, progress.decisions.length, progress.acknowledged]);
  function reset() {
    setProgress(fresh());
    setConfirmReset(false);
    window.location.hash = "module";
  }
  const startLink = completed === scenes.length ? "#results" : "#play";
  return (
    <div className="wk-module">
      <a className="skip" href="#wk-main">
        К содержанию
      </a>
      <header className="wk-header">
        <a
          className="wk-brand"
          href="#module"
          aria-label="William & Kate Academy — модуль"
        >
          <b>
            W<span>&</span>K
          </b>
          <span>
            William & Kate<small>АКАДЕМИЯ КОМАНДЫ</small>
          </span>
        </a>
        <span className="pilot">Учебный пилот</span>
      </header>
      <main id="wk-main">
        {warning && (
          <aside className="save-warning" role="status">
            {warning}{" "}
            <button
              onClick={() => {
                try {
                  localStorage.setItem(key, JSON.stringify(progress));
                  setWarning("");
                } catch {
                  setWarning(
                    "Сохранение по-прежнему недоступно. Продолжай в этой вкладке.",
                  );
                }
              }}
            >
              Повторить сохранение
            </button>
          </aside>
        )}
        {page === "#module" && (
          <>
            <section className="wk-hero">
              <div>
                <p className="eyebrow">МОДУЛЬ 01 / ПЕРВЫЕ ШАГИ</p>
                <h1 ref={heading} tabIndex={-1}>
                  Хорошая смена
                  <br />
                  начинается
                  <br />
                  <em>с внимания.</em>
                </h1>
                <p className="intro">
                  Здесь учатся замечать людей, принимать решения и быть частью
                  команды. Твоими словами. В твоём темпе.
                </p>
                <div className="hero-actions">
                  <a className="primary" href={startLink}>
                    {completed === scenes.length
                      ? "Посмотреть итоги"
                      : progress.decisions.length
                        ? "Продолжить смену"
                        : "Начать первую смену"}{" "}
                    <span aria-hidden="true">↗</span>
                  </a>
                  <span>5 ситуаций · около 10–15 минут</span>
                </div>
              </div>
              <div className="pub-window" aria-hidden="true">
                <div className="window-sign">THE FIRST SHIFT</div>
                <div className="window-panes">
                  <span>01</span>
                  <span>
                    ВНИМАНИЕ
                    <br />К ЛЮДЯМ
                  </span>
                </div>
                <div className="window-sill">WILLIAM & KATE</div>
                <p>
                  У каждого профессионала
                  <br />
                  была первая смена.
                </p>
              </div>
            </section>
            <section className="journey">
              <div className="section-title">
                <div>
                  <p className="eyebrow">ТВОЙ МАРШРУТ</p>
                  <h2>От знакомства — к уверенности</h2>
                </div>
                <span>
                  {completed} / {scenes.length} пройдено
                </span>
              </div>
              <progress
                max={scenes.length}
                value={completed}
                aria-label="Пройдено ситуаций"
              />
              <ol className="scene-list">
                {scenes.map((scene, i) => (
                  <li key={scene.id}>
                    <span
                      className={`step-number ${i < completed ? "done" : ""}`}
                    >
                      {i < completed ? "✓" : `0${i + 1}`}
                    </span>
                    <div>
                      <h3>{scene.title}</h3>
                      <p>{scene.brief}</p>
                    </div>
                    <span className="scene-state">
                      {i < completed
                        ? "Разобрано"
                        : i === completed
                          ? "Следующий шаг"
                          : scene.skill}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
            <section className="ground-rules">
              <div>
                <p className="eyebrow">КАК ЗДЕСЬ УЧАТЬСЯ</p>
                <h2>
                  Пробуй. Замечай.
                  <br />
                  Разбирайся.
                </h2>
              </div>
              <div>
                <p>
                  В каждой ситуации ты выбираешь действие и видишь возможное
                  последствие. Следующий шаг зависит от твоего решения: развить
                  удачный контакт или исправить ошибку.
                </p>
                <p>
                  Здесь нет таймера и гонки за баллами. Ошибка — повод
                  разобраться. Примеры ответов помогают понять смысл, их не
                  нужно заучивать.
                </p>
              </div>
            </section>
          </>
        )}
        {page === "#play" &&
          (completed === scenes.length && !pending ? (
            <section className="learning">
              <h1 ref={heading} tabIndex={-1}>
                Смена разобрана
              </h1>
              <p>
                Все пять ситуаций пройдены. Вернись к итогам и обсуди вопросы с
                наставником.
              </p>
              <a className="primary" href="#results">
                Открыть итоги ↗
              </a>
            </section>
          ) : (
            <section className="learning">
              <div className="lesson-top">
                <a href="#module">← Маршрут</a>
                <span>
                  Ситуация {Math.min(completed + 1, scenes.length)} из{" "}
                  {scenes.length}
                </span>
              </div>
              <progress
                max={scenes.length}
                value={completed}
                aria-label="Пройдено ситуаций"
              />
              <div className="lesson-grid">
                <aside className="scene-context">
                  <p className="eyebrow">{activeScene.place}</p>
                  <div className="scene-icon" aria-hidden="true">
                    {["♧", "⌂", "☷", "◷", "◇"][scenes.indexOf(activeScene)]}
                  </div>
                  <h2>{activeScene.title}</h2>
                  <p>{activeScene.brief}</p>
                  <span className="skill-tag">{activeScene.skill}</span>
                  <p className="context-note">
                    Это учебная ситуация.
                    <br />
                    Последствия — возможный сценарий, а не прогноз поведения
                    каждого гостя.
                  </p>
                </aside>
                <div className="decision-card">
                  {pending ? (
                    <>
                      <p className="eyebrow">
                        {pending.choice.thoughtful
                          ? "ЕСТЬ НА ЧТО ОПЕРЕТЬСЯ"
                          : "ЕСТЬ ЧТО РАЗОБРАТЬ"}
                      </p>
                      <h1 ref={heading} tabIndex={-1}>
                        {pending.choice.thoughtful
                          ? "Контакт становится яснее"
                          : "Давай посмотрим на последствия"}
                      </h1>
                      <p className="chosen">
                        <span>Твоё действие</span>
                        {pending.choice.text}
                      </p>
                      <div className="consequence" role="status">
                        <h3>Что может произойти</h3>
                        <p>{pending.choice.consequence}</p>
                      </div>
                      <h3>Почему это важно</h3>
                      <p>{pending.choice.why}</p>
                      {!pending.choice.next && (
                        <div className="takeaway">
                          <h3>Забери с собой</h3>
                          <p>{pending.scene.takeaway}</p>
                        </div>
                      )}
                      <button
                        className="primary"
                        onClick={() => {
                          const next = acknowledge(progress);
                          setProgress(next);
                          if (completedScenes(next) === scenes.length)
                            window.location.hash = "results";
                        }}
                      >
                        {pending.choice.next
                          ? "Что будет дальше →"
                          : pos.complete
                            ? "К итогам смены →"
                            : "Следующая ситуация →"}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="eyebrow">
                        {pos.nodeId === "start"
                          ? "ТВОЙ ВЫБОР"
                          : "ПРОДОЛЖЕНИЕ СИТУАЦИИ"}
                      </p>
                      <h1 ref={heading} tabIndex={-1}>
                        {activeNode.title}
                      </h1>
                      <p className="story">{activeNode.text}</p>
                      <h3>{activeNode.prompt}</h3>
                      <div className="choices">
                        {activeNode.choices.map((choice, i) => (
                          <button
                            key={choice.id}
                            onClick={() =>
                              setProgress((p) => decide(p, choice.id))
                            }
                          >
                            <span className="choice-letter">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span>{choice.text}</span>
                            <span aria-hidden="true">↗</span>
                          </button>
                        ))}
                      </div>
                      <p className="hint">
                        Выбери действие, которое кажется тебе подходящим. После
                        выбора откроется разбор.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </section>
          ))}
        {page === "#results" && (
          <section className="results">
            <p className="eyebrow">ТВОЙ ОПЫТ / МОДУЛЬ 01</p>
            <h1 ref={heading} tabIndex={-1}>
              {completed === scenes.length
                ? "Первые шаги сделаны."
                : "Смена ещё продолжается."}
            </h1>
            <p className="intro">
              {completed === scenes.length
                ? "Ты разобрал пять ситуаций. Теперь можно перенести эти наблюдения в настоящую смену — вместе с наставником."
                : `Разобрано ${completed} из ${scenes.length} ситуаций. Оставшиеся шаги ждут на маршруте.`}
            </p>
            {completed < scenes.length && (
              <a className="primary" href="#play">
                Продолжить обучение →
              </a>
            )}
            <div className="result-grid">
              {scenes.slice(0, completed).map((scene) => (
                <article key={scene.id}>
                  <p className="eyebrow">{scene.skill}</p>
                  <h2>{scene.title}</h2>
                  <p>{scene.takeaway}</p>
                  <details>
                    <summary>Мои решения и разбор</summary>
                    {progress.decisions
                      .filter((d) => d.scene === scene.id)
                      .map((d) => {
                        const { node, choice } = detail(d);
                        return (
                          <div className="review" key={d.node}>
                            <h3>{node.title}</h3>
                            <p>
                              <strong>Выбор:</strong> {choice.text}
                            </p>
                            <p>
                              <strong>Последствие:</strong> {choice.consequence}
                            </p>
                            <p>{choice.why}</p>
                          </div>
                        );
                      })}
                  </details>
                </article>
              ))}
            </div>
            {completed === scenes.length && (
              <section className="mentor">
                <p className="eyebrow">СЛЕДУЮЩИЙ ШАГ — В ЗАЛЕ</p>
                <h2>Обсуди с наставником</h2>
                <ul>
                  <li>Кто помогает новичку и как распределяются столы?</li>
                  <li>
                    Где проверять наличие, состав и аллергены? Как передавать
                    такой запрос кухне?
                  </li>
                  <li>
                    Кто решает вопросы задержек, замен, отмен и компенсаций?
                  </li>
                </ul>
                <p>
                  Завершение модуля не означает допуск к самостоятельной смене.
                  Практику и готовность оценивает ответственный сотрудник.
                </p>
              </section>
            )}
          </section>
        )}
        <aside className="approval-note">
          <strong>Материал для согласования</strong>
          <p>
            Это авторские учебные ситуации, а не утверждённые стандарты William
            & Kate Pub. Порядок размещения, работа с аллергенами, исправлениями
            заказа и полномочия сотрудников требуют согласования с
            руководителем.
          </p>
        </aside>
      </main>
      <footer className="wk-footer">
        <div>
          <strong>Внимание к гостю. Уважение к себе.</strong>
          <p>
            {warning
              ? "Прогресс сейчас хранится только в этой вкладке."
              : learnerId === "local"
                ? "Прогресс сохраняется в этом браузере, без аккаунта. На общем устройстве имей это в виду."
                : "Прогресс сохраняется в этом браузере для выбранного сотрудника."}{" "}
            Между устройствами не переносится.
          </p>
        </div>
        <div>
          {confirmReset ? (
            <div className="reset-confirm">
              <span>Удалить все решения этого прохождения?</span>
              <button onClick={reset}>Да, начать заново</button>
              <button onClick={() => setConfirmReset(false)}>Отмена</button>
            </div>
          ) : (
            <button
              className="text-button"
              onClick={() => setConfirmReset(true)}
            >
              Начать заново
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
