export type ThreadMessage = {
  id: string;
  body: string;
  createdAt: Date;
  visibility: string;
  fromUser: { id: string; name: string };
};

export function messageDayKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function groupMessagesByDay<T extends { createdAt: Date }>(messages: T[]) {
  const groups: { key: string; items: T[] }[] = [];
  for (const message of messages) {
    const key = messageDayKey(message.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(message);
    else groups.push({ key, items: [message] });
  }
  return groups;
}

export function nameInitial(name: string) {
  const letter = name.trim().charAt(0);
  return letter ? letter.toUpperCase() : "?";
}
