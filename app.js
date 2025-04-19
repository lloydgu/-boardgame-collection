const { createApp } = Vue;

createApp({
    data() {
        return {
            games: [],
            searchText: '',
            selectedTags: new Set() // 新增标签选择状态
        }
    },
    computed: {
        filteredGames() {
            return this.games.filter(game => {
                // 原有搜索逻辑
                const textMatch = this.searchText === '' || 
                    game.名称.toLowerCase().includes(this.searchText.toLowerCase()) ||
                    game.标签.some(tag => 
                        tag.toLowerCase().includes(this.searchText.toLowerCase())
                    );
                
                // 新增标签过滤逻辑
                const tagMatch = this.selectedTags.size === 0 || 
                    Array.from(this.selectedTags).every(tag => 
                        game.标签.includes(tag)
                    );
                
                return textMatch && tagMatch;
            });
        }
    },
    methods: {
        // 新增标签切换方法
        toggleTag(tag) {
            this.selectedTags.has(tag) ?
                this.selectedTags.delete(tag) :
                this.selectedTags.add(tag);
        },
        
        // 原有数据加载方法修改
        async loadData() {
            try {
                const response = await fetch('https://sheetdb.io/api/v1/anwk6x0uukfcf');
                const rawData = await response.json();
                
                // 数据标准化处理
                this.games = rawData.map(item => ({
                    ...item,
                    标签: item.标签.split(',') // 转换标签为数组
                        .map(t => t.trim())
                        .filter(t => t !== ''),
                    难度: Number(item.难度) || 0
                }));
                
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