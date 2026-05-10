export function createTagStore(initialTags = []) {
  let tags = uniqueClean(initialTags);

  return {
    list() {
      return [...tags];
    },
    add(tag) {
      const cleaned = cleanTag(tag);
      if (cleaned && !tags.includes(cleaned)) {
        tags = [...tags, cleaned];
      }
      return [...tags];
    },
    remove(tag) {
      tags = tags.filter((item) => item !== tag);
      return [...tags];
    }
  };
}

function uniqueClean(tags) {
  return tags.reduce((items, tag) => {
    const cleaned = cleanTag(tag);
    if (cleaned && !items.includes(cleaned)) items.push(cleaned);
    return items;
  }, []);
}

function cleanTag(tag) {
  return String(tag == null ? "" : tag).trim();
}
