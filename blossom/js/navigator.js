/** Quest navigation — Last War style: tap task → camera + auto-walk to objective */
window.BlossomNavigate = (function () {
  const MEAL_TASKS = {
    breakfast: { label: 'Breakfast', emoji: '☕', stars: 5 },
    lunch: { label: 'Lunch', emoji: '🥪', stars: 5 },
    dinner: { label: 'Dinner', emoji: '🍽️', stars: 5 },
  };

  const HB_CHORES = window.BlossomHBLocal?.CHORES || {};
  const CHORE_LABELS = {
    bed: 'Make bed', dishes: 'Wash dishes', homework: 'Do homework', teeth: 'Brush teeth',
    sweep: 'Sweep floor', plants: 'Water plants', trash: 'Take out trash', plants_out: 'Water garden',
    mailbox: 'Check mail',
    groceries: HB_CHORES.groceries || 'Grocery run on Main',
    litter: HB_CHORES.litter || 'Pick up litter on Main',
    ducks: HB_CHORES.ducks || 'Feed shorebirds by the pier',
    playground: HB_CHORES.playground || 'Tidy beach volleyball courts',
  };

  function propCenter(p, locId) {
    if (window.BlossomWorld3D && locId) {
      const c = BlossomWorld3D.propCenter3D(p, locId);
      return { x: c.wx, y: c.wz, wx: c.wx, wz: c.wz };
    }
    return {
      x: p.x + (p.w || 50) / 2,
      y: p.y + (p.h || 50) / 2,
    };
  }

  function findPropInLocation(locId, predicate) {
    const loc = BlossomWorld.getLocation(locId);
    const prop = loc.props.find(predicate);
    if (!prop) return null;
    return { locId, prop, center: propCenter(prop, locId) };
  }

  function findPropForChore(choreId) {
    for (const locId of Object.keys(BlossomWorld.LOCATIONS)) {
      const hit = findPropInLocation(locId, (p) => p.choreId === choreId);
      if (hit) return hit;
    }
    return null;
  }

  function findFridge() {
    return findPropInLocation('house', (p) => p.kind === 'fridge');
  }

  function findCafe() {
    const ids = window.BlossomHBLocal?.RESTAURANTS || ['cafe'];
    for (const id of ids) {
      const hit = findPropInLocation('street', (p) => p.kind === 'shop' && p.shop === id);
      if (hit) return hit;
    }
    return null;
  }

  function buildLocationGraph() {
    const graph = {};
    Object.keys(BlossomWorld.LOCATIONS).forEach((locId) => {
      graph[locId] = {};
      BlossomWorld.getLocation(locId).props
        .filter((p) => p.kind === 'exit' && p.to)
        .forEach((ex) => {
          graph[locId][ex.to] = ex;
        });
    });
    return graph;
  }

  function getTravelPath(fromId, toId) {
    if (fromId === toId) return [];
    const graph = buildLocationGraph();
    const queue = [[fromId]];
    const seen = new Set([fromId]);
    while (queue.length) {
      const path = queue.shift();
      const cur = path[path.length - 1];
      const neighbors = graph[cur] || {};
      for (const next of Object.keys(neighbors)) {
        if (seen.has(next)) continue;
        const nextPath = [...path, next];
        if (next === toId) return nextPath.slice(1);
        seen.add(next);
        queue.push(nextPath);
      }
    }
    return [];
  }

  function waypointsForPath(fromId, path, finalTarget) {
    const wps = [];
    let cur = fromId;
    const use3d = !!window.BlossomWorld3D;
    const openWorld = use3d && BlossomWorld3D.isOverworld?.();
    if (openWorld && finalTarget) {
      const c = finalTarget.center;
      wps.push({
        type: 'target',
        wx: c.wx ?? c.x,
        wz: c.wz ?? c.y,
        locId: finalTarget.locId,
        prop: finalTarget.prop,
        taskId: finalTarget.taskId,
      });
      return wps;
    }
    path.forEach((nextId) => {
      const ex = BlossomWorld.getLocation(cur).props.find((p) => p.kind === 'exit' && p.to === nextId);
      if (ex) {
        const c = propCenter(ex, cur);
        const floorY = BlossomWorld.getLocation(cur).floorY - 20;
        const wp = {
          type: 'exit',
          x: use3d ? undefined : c.x,
          y: use3d ? undefined : floorY,
          wx: c.wx ?? c.x,
          wz: c.wz ?? c.y,
          locId: cur,
          to: nextId,
          spawn: ex.spawn,
          exit: ex,
        };
        wps.push(wp);
      }
      cur = nextId;
    });
    if (finalTarget) {
      const floorY = BlossomWorld.getLocation(finalTarget.locId).floorY - 20;
      const c = finalTarget.center;
      wps.push({
        type: 'target',
        x: use3d ? undefined : (c.x ?? finalTarget.center.x),
        y: use3d ? undefined : floorY,
        wx: c.wx ?? c.x,
        wz: c.wz ?? c.y,
        locId: finalTarget.locId,
        prop: finalTarget.prop,
        taskId: finalTarget.taskId,
      });
    }
    return wps;
  }

  function resolveMealTarget(mealKey, state) {
    const phase = BlossomDay.currentPhase(state);
    if (mealKey === 'lunch' && phase.meal === 'lunch' && state.currentLocation === 'street') {
      const cafe = findCafe();
      if (cafe) return { ...cafe, taskId: 'lunch' };
    }
    const fridge = findFridge();
    if (fridge) return { ...fridge, taskId: mealKey };
    return null;
  }

  function nextUndoneChore(state) {
    const list = state.todaysChores || [];
    const done = state.choresDone || {};
    return list.find((id) => !done[id]) || null;
  }

  function buildNavigableTasks(state) {
    const tasks = [];
    const done = state.choresDone || {};
    const meals = state.mealsEaten || {};

    if (!meals.breakfast) {
      tasks.push({
        id: 'breakfast', type: 'meal', ...MEAL_TASKS.breakfast,
        hint: 'Tap fridge · pick breakfast',
      });
    }

    (state.todaysChores || []).forEach((choreId) => {
      if (done[choreId]) return;
      const hit = findPropForChore(choreId);
      const loc = hit ? BlossomWorld.getLocation(hit.locId) : null;
      tasks.push({
        id: choreId,
        type: 'chore',
        label: CHORE_LABELS[choreId] || choreId,
        emoji: '🧹',
        stars: 5,
        locationName: loc?.name || 'Somewhere',
        hint: hit ? `Go to ${loc.name}` : 'Find this chore',
      });
    });

    if (!meals.lunch) {
      tasks.push({
        id: 'lunch', type: 'meal', ...MEAL_TASKS.lunch,
        hint: 'Fridge at home or Main St restaurants for lunch',
      });
    }
    if (!meals.dinner) {
      tasks.push({
        id: 'dinner', type: 'meal', ...MEAL_TASKS.dinner,
        hint: 'Tap fridge · pick dinner',
      });
    }

    const goal = BlossomGuide.starsGoal(state);
    if (state.stars < goal) {
      tasks.push({
        id: 'stars', type: 'meta', label: `Reach ${goal} stars`, emoji: '⭐',
        stars: null, hint: 'Complete tasks above',
        done: false,
      });
    }

    return tasks;
  }

  function resolveTaskTarget(taskId, state) {
    if (taskId === 'breakfast' || taskId === 'lunch' || taskId === 'dinner') {
      return resolveMealTarget(taskId, state);
    }
    if (CHORE_LABELS[taskId]) {
      const hit = findPropForChore(taskId);
      if (hit) return { ...hit, taskId };
    }
    const next = nextUndoneChore(state);
    if (next) {
      const hit = findPropForChore(next);
      if (hit) return { ...hit, taskId: next };
    }
    return null;
  }

  function planNavigation(taskId, state) {
    const target = resolveTaskTarget(taskId, state);
    if (!target) return null;
    const fromId = state.currentLocation || 'house';
    const path = getTravelPath(fromId, target.locId);
    const waypoints = waypointsForPath(fromId, path, target);
    return { taskId, target, waypoints, path };
  }

  function taskIsDone(state, taskId) {
    if (taskId === 'breakfast') return !!state.mealsEaten?.breakfast;
    if (taskId === 'lunch') return !!state.mealsEaten?.lunch;
    if (taskId === 'dinner') return !!state.mealsEaten?.dinner;
    if (taskId === 'stars') return state.stars >= BlossomGuide.starsGoal(state);
    return !!state.choresDone?.[taskId];
  }

  return {
    MEAL_TASKS,
    CHORE_LABELS,
    findPropForChore,
    findFridge,
    findCafe,
    getTravelPath,
    buildNavigableTasks,
    resolveTaskTarget,
    planNavigation,
    taskIsDone,
    propCenter,
  };
})();