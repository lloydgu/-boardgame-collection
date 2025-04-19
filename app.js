const { createApp } = Vue;

createApp({
    data() {
        return {
            games: [],
            searchText: '',
            selectedTags: new Set(),
            allTags: [],
            tagCounts: {}
        }
    },
    computed: {
        filteredGames() {
            return this.games.filter(game => {
                const searchMatch = this.searchText ?
                    game.名称.toLowerCase().includes(this.searchText.toLowerCase()) ||
                    game.标签.some(tag => tag.toLowerCase().includes(this.searchText.toLowerCase()))
                    : true;

                const tagMatch = this.selectedTags.size === 0 || 
                    Array.from(this.selectedTags).every(tag => 
                        game.标签.includes(tag)
                    );

                return searchMatch && tagMatch;
            });
        }
    },
    methods: {
        // 生成动态标签样式
        tagStyle(tag) {
            const hue = this.stringToHue(tag);
            return {
                backgroundColor: `hsla(${hue}, 70%, 90%, 0.9)`,
                borderColor: `hsl(${hue}, 70%, 60%)`,
                color: `hsl(${hue}, 50%, 30%)`
            }
        },

        // 字符串转色相值
        stringToHue(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            return Math.abs(hash % 360);
        },

        // 标签交互
        toggleTag(tag) {
            this.selectedTags.has(tag) ?
                this.selectedTags.delete(tag) :
                this.selectedTags.add(tag);
            
            // 滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        removeTag(tag) {
            this.selectedTags.delete(tag);
        },

        // 可见性判断（用于半透明效果）
        isGameVisible(game) {
            return this.selectedTags.size === 0 || 
                game.标签.some(tag => this.selectedTags.has(tag));
        },

        // 加载并处理数据
        async loadData() {
            try {
                const response = await fetch('YOUR_SHEETDB_API_URL');
                const rawData = await response.json();
                
                // 数据标准化处理
                this.games = rawData.map(item => ({
                    ...item,
                    标签: item.标签.split(',').map(t => t.trim()).filter(t => t),
                    难度: Number(item.难度) || 0
                }));

                // 生成标签统计
                this.generateTagCounts();
                this.setupLazyLoad();
                
                // 本地缓存
                localStorage.setItem('gamesCache', JSON.stringify(this.games));
            } catch (error) {
                console.error('数据加载失败:', error);
                const cache = localStorage.getItem('gamesCache');
                if(cache) this.games = JSON.parse(cache);
            }
        },

        // 生成标签统计
        generateTagCounts() {
            const counts = {};
            this.games.forEach(game => {
                game.标签.forEach(tag => {
                    counts[tag] = (counts[tag] || 0) + 1;
                });
            });
            this.tagCounts = counts;
        },

        // 图片懒加载
        setupLazyLoad() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        observer.unobserve(img);
                    }
                });
            });

            this.$nextTick(() => {
                document.querySelectorAll('.lazyload').forEach(img => {
                    observer.observe(img);
                });
            });
        }
    },
    mounted() {
        this.loadData();
    }
}).mount('#app');