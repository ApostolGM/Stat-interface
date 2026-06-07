async function buyItem(item) {
    if (!currentUserId) return;
    if (getTokens() < item.price) { /* ... */ }
    const newTokens = getTokens() - item.price;
    if (item.tags && item.tags.includes('bestiary')) {
        // Находим группу персонажа
        const char = window.selectedCharacter;
        if (!char || !char.groupId) {
            log('ОШИБКА: ВЫ НЕ СОСТОИТЕ В ГРУППЕ');
            return;
        }
        import('./groups-config.js').then(async module => {
            const groups = await new Promise(resolve => {
                let unsub = module.subscribeToGroups(g => {
                    resolve(g);
                    unsub();
                });
            });
            const group = groups.find(g => g.id === char.groupId);
            if (group) {
                const bestiary = group.bestiary || [];
                bestiary.push({
                    id: item.id,
                    name: item.name,
                    image: item.image || '',
                    description: item.description || ''
                });
                const updatedGroup = { ...group, bestiary };
                const newGroups = groups.map(g => g.id === group.id ? updatedGroup : g);
                await module.updateGroups(newGroups);
                log(`ЗАПИСЬ О ${item.name} ДОБАВЛЕНА В БЕСТИАРИЙ ГРУППЫ`);
            }
        });
    } else {
        const newInventory = [...getInventory(), item.name];
        await updateUserData(currentUserId, { tokens: newTokens, inventory: newInventory });
        log(`КУПЛЕНО: ${item.name}. -${item.price} РК.`);
    }
}
