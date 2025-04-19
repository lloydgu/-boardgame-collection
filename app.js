const { createApp } = Vue;

createApp({
    data() {
        return {
            games: [],
            searchText: '',
            selectedTags: new Set(),
            allTags: []
        }
    },
    computed: {
        filteredGames() {
            return this.games.filter(game => {
                // 文本搜索匹配
                const textMatch = this.searchText.toLowerCase() === '' || 
                    game.名称.toLowerCase().includes(this.searchText.toLowerCase()) ||
                    game.标签.some(tag => 
                        tag.toLowerCase().includes(this.searchText.toLowerCase())
                    );
                
                // 标签匹配（AND逻辑）
                const tagMatch = this.selectedTags.size === 0 ||
                    Array.from(this.selectedTags).every(tag => 
                        game.标签.includes(tag)
                    );
                
                return textMatch && tagMatch;
            });
        }
    },
    methods: {
        // 切换标签选择
        toggleTag(tag) {
            this.selectedTags.has(tag) ?
                this.selectedTags.delete(tag) :
                this.selectedTags.add(tag);
        },
        
        // 移除单个标签
        removeTag(tag) {
            this.selectedTags.delete(tag);
        },
        
        // 加载数据
        async loadData() {
            try {
                const response = await fetch('https://sheetdb.io/api/v1/anwk6x0uukfcf');
                const rawData = await response.json();
                
                // 数据标准化处理
                this.games = rawData.map(item => ({
                    ...item,
                    标签: item.标签.split(',')
                        .map(t => t.trim())
                        .filter(t => t !== ''),
                    难度: Number(item.难度) || 0
                }));
                
                // 提取所有标签
                this.allTags = [...new Set(
                    this.games.flatMap(game => game.标签)
                )];
                
                // 本地缓存
                localStorage.setItem('gamesCache', JSON.stringify(this.games));
            } catch (error) {
                console.error('数据加载失败:', error);
                const cache = localStorage.getItem('gamesCache');
                if(cache) this.games = JSON.parse(cache);
            }
        }
    },
    mounted() {
        this.loadData();
    }
}).mount('#app');