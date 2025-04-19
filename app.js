const { createApp } = Vue;

createApp({
    data() {
        return {
            games: [],          // 存储所有游戏数据
            searchText: '',     // 搜索关键词
            selectedTags: new Set(), // 选中标签集合
            allTags: []         // 所有标签列表
        }
    },
    computed: {
        // 组合过滤逻辑
        filteredGames() {
            return this.games.filter(game => {
                // 文本搜索（名称或标签）
                const textMatch = game.名称.toLowerCase().includes(this.searchText.toLowerCase()) ||
                               game.标签.toLowerCase().includes(this.searchText.toLowerCase());
                
                // 标签匹配（需满足所有选中标签）
                const tagMatch = this.selectedTags.size === 0 || 
                               Array.from(this.selectedTags).every(tag => 
                                   game.标签.split(',').includes(tag)
                               );
                
                return textMatch && tagMatch;
            });
        }
    },
    methods: {
        // 标签选择切换
        toggleTag(tag) {
            this.selectedTags.has(tag) ?
                this.selectedTags.delete(tag) :
                this.selectedTags.add(tag);
        },
        
        // 加载数据
        async loadData() {
            try {
                const response = await fetch('https://sheetdb.io/api/v1/anwk6x0uukfcf');
                const data = await response.json();
                this.games = data.map(item => ({
                    ...item,
                    难度: Number(item.难度) // 确保难度是数字类型
                }));
                
                // 提取所有标签
                this.allTags = [...new Set(
                    this.games.flatMap(game => game.标签.split(','))
                )].sort();
                
                // 本地缓存
                localStorage.setItem('gamesCache', JSON.stringify(this.games));
            } catch (error) {
                console.error('数据加载失败:', error);
                // 尝试使用缓存数据
                const cache = localStorage.getItem('gamesCache');
                if(cache) this.games = JSON.parse(cache);
            }
        }
    },
    mounted() {
        this.loadData();
    }
}).mount('#app');