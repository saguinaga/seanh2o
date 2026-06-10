// model.js

function loadScenario(id) {
    return JSON.parse(localStorage.getItem(`scenario-${id}`));
}

function saveScenario(scenarioData, id) {
    localStorage.setItem(`scenario-${id}`, JSON.stringify(scenarioData));
}

function deleteScenario(id) {
    localStorage.removeItem(`scenario-${id}`);
}

export { loadScenario, saveScenario, deleteScenario };
