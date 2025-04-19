const { createApp } = Vue;

createApp({
    data() {
        return {
            games: [],
            searchText: '',
            selectedTags: new Set(),
            categoryMap: {
                weight: '🎚️ 来点轻松的，还是玩个硬的？',
                theme: '🌍 想去哪里，想看什么风景？',
                mechanic: '⚙️ 整点什么活？',
                other: '🌟 还有什么别的想法？'
            },
            selectedCategoryTags: {
                weight: new Set(),
                theme: new Set(),
                mechanic: new Set(),
                other: new Set()
            },
            isLoading: true
        }
    },
    computed: {
        filteredGames() {
            return this.games.filter(game => {
                // 文本搜索匹配
                const textMatch = !this.searchText || 
                    game.名称.toLowerCase().includes(this.searchText.toLowerCase()) ||
                    game.标签.some(tag => 
                        !this.isCategoryTag(tag) &&
                        tag.toLowerCase().includes(this.searchText.toLowerCase())
                    );

                // 自由标签匹配
                const freeTagMatch = this.selectedTags.size === 0 || 
                    Array.from(this.selectedTags).some(tag => 
                        game.标签.includes(tag)
                    );

                // 分类标签匹配
                const categoryMatch = Object.entries(this.selectedCategoryTags)
                    .every(([cat, tags]) => 
                        tags.size === 0 || 
                        game.标签.some(gameTag => {
                            const [category, value] = this.splitTag(gameTag);
                            return category === cat && tags.has(value);
                        })
                    );

                return textMatch && freeTagMatch && categoryMatch;
            });
        }
    },
    methods: {
        splitTag(tag) {
            const parts = tag.split(':');
            if (parts.length === 1) {
                const existingCategories = ['weight', 'theme', 'mechanic'];
                const isCategorized = existingCategories.some(cat => 
                    this.getCategoryTags(cat).includes(tag)
                );
                return [isCategorized ? 'custom' : 'other', tag.trim()];
            }
            return [parts[0].trim().toLowerCase(), parts[1].trim()];
        },

        toggleCategoryTag(category, tag) {
            const selected = this.selectedCategoryTags[category];
            selected.has(tag) ? selected.delete(tag) : selected.add(tag);
        },

        toggleTag(tag) {
            this.selectedTags.has(tag) ? 
                this.selectedTags.delete(tag) : 
                this.selectedTags.add(tag);
        },

        toggleParsedTag(tag) {
            const [category, value] = this.splitTag(tag);
            if (this.categoryMap[category]) {
                this.toggleCategoryTag(category, value);
            }
        },

        getCategoryTags(category) {
            const tagCounts = {};
            this.games.forEach(game => {
                game.标签.forEach(tag => {
                    const [cat, val] = this.splitTag(tag);
                    if (cat === category) {
                        tagCounts[val] = (tagCounts[val] || 0) + 1;
                    }
                });
            });
            
            return Object.entries(tagCounts)
                .sort((a, b) => b[1] - a[1])
                .map(item => item[0]);
        },

        getTagCount(category, tag) {
            return this.games.reduce((count, game) => {
                return count + game.标签.filter(t => {
                    const [cat, val] = this.splitTag(t);
                    return cat === category && val === tag;
                }).length;
            }, 0);
        },

        isCategoryTag(tag) {
            return tag.includes(':');
        },

        getTagCategory(tag) {
            return this.splitTag(tag)[0];
        },

        getTagName(tag) {
            return this.splitTag(tag)[1];
        },

        async loadData() {
            try {
                const response = await fetch('https://sheetdb.io/api/v1/anwk6x0uukfcf');
                const rawData = await response.json();
                
                this.games = rawData.map(item => ({
                    ...item,
                    标签: item.标签?.split(',').map(t => t.trim()) || [],
                    难度: Math.min(5, Math.max(1, Number(item.难度) || 3))
                }));

                localStorage.setItem('gamesCache', JSON.stringify(this.games));
            } catch (error) {
                console.error('数据加载失败:', error);
                const cache = localStorage.getItem('gamesCache');
                if (cache) this.games = JSON.parse(cache);
            } finally {
                this.isLoading = false;
            }
        }
    },
    mounted() {
        this.loadData();
    }
}).mount('#app');