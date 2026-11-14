// Load add-ons: fetches the add-on packs listed in data/addons/index.json (each in data/addons/<id>/pack.json).
// They're kept apart from the regular game. If they can't load, the app still works, with no add-ons.
const getJson = async (path) => {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Couldn't load ${path}`);
  return res.json();
};

export async function loadAddons() {
  try {
    const ids = await getJson('data/addons/index.json');
    return await Promise.all(ids.map((id) => getJson(`data/addons/${id}/pack.json`)));
  } catch {
    return [];
  }
}
