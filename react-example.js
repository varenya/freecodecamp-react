/* News API data structure
 *  object Article
 *    object author
 *      url picture
 *      string username
 *    string headline
 *    url image
 *    url link
 *    string metaDescription
 *    number rank
 *    unixTime timePosted
 */

/* Goal: one stateful component
 *  event happens -> state changes -> invoker receives new state as props
 *
 *  Should happen
 *    After initial render -> load data
 *    on loadRquest        -> return copy of data piece -> dispatch
 *    on sortRequest       -> sort copy of data         -> dispatch
 *    on searchReqeust     -> filter copy of data       -> dispatch
 *
 *  What should happens when all of those requests are made
 *    e.g) user selected sort option then searched for content after loading few articels?
 *    Since original data is not mutated new pieces of data will render without trouble.
 *
 *  What should each requestHandler do?
 *    loadRequest
 *      increase loadAmount by loadLimit
 *    sortRequest
 *      set sortKey to known input value
 *    searchRequest
 *      set searchKeyword
 */

// Any props required by components
/*  These props will be passed around as property of props named 'vars'
 *  Each toplevel property represent props required to set the components.
 *    e.g) core refers to root owner, toolbar represent Toolbar component etc...
 *  All components should only access property belonging to them.
 *    There is no restriction so I need to make sure I pass the right props.
 *    (With module system this step is unnecessary)
 *  So for every component, props.vars should know every external props needed for that component
 *
 * Questions needs to be answered.
 *  What is the consequency of component knowing more than it should?
 *    Right now child components determines data it uses rather than,
 *    owner component determining data for child components.
 *    This smells (mostly on security) but I couldn't find reasons not to do it and it's quite convinient.
 *    Will doing this result bad consequencies?
 */
let CONFIG = {
  core: {
    url: "http://www.freecodecamp.com/news/hot",
    loadLimit: 9
  },
  toolbar: {
    sortTab: {
      sortOption: [
        {id: 'sort-by-date', value: 'timePosted', label: 'Newest', name: "sortTab"},
        {id: 'sort-by-rank', value: 'rank', label: 'Most liked', name: "sortTab"}
      ]
    },
    searchTab: {
      searchField: {
        name: 'search-field',
        searchOption: [
          {value: 'all', label: 'all category'},
          {value: 'headline', label: 'on headline'},
          {value: 'metaDescription', label: 'on abstract'},
          {value: 'author', label: 'on author'},
        ]
      }
    }
  }
};

let filter = Array.prototype.filter;

// Dispatch article data, state, handlers
// state passed to child as props will be named rootState (change name later)
let CamperNews = React.createClass({
  getInitialState() {
    let core = this.props.core;

    return {
      data: [],
      loadAmount: core.loadLimit,
      sortKey: 'timePosted',
      searchField: 'headline',
      searchRe: null
    }
  },
  componentDidMount() {
    let core = this.props.core;

    $.ajax({
      url: core.url,
      dataType: 'json',
      cache: false,
      success: (data => {
        this.setState({data: data});
      }).bind(this),
      error: (e => {
        console.log(e);
      }).bind(this)
    });
  },
  handleLoadMore(event) {
    let core = this.props.core;
    // Set loadAmount
    let newAmount = this.state.loadAmount + core.loadLimit;
    this.setState({loadAmount: newAmount });
  },
  handleSortKey(event) {
    // Set sortKey
    if (event.target.type === 'radio')
      this.setState({sortKey: event.target.value});
  },
  handleSearchField(event) {
    // Assume event.target always have value
    // Assume event.target is always 'option'
    this.setState({searchField: event.target.value});
  },
  // I think it is not bad to leave hanldeSearchField alone.
  // Once I find better way to parse form input, implement handleSearchSubmit().
  handleSearchInput(event) {
    event.preventDefault();
    // Set searchKeyword
    let target = event.target[0]; // Shouldn't there be another way of accessing input?
    let keywords = null;

    if (target.value) {
      keywords = target.value.split(/\s+/).join('|');
      target.value = ''; // Clear search input.
    }

    this.setState( {searchRe: keywords && new RegExp(keywords, 'gim') });
  },
  render() {
    let props = this.props;
    let state = this.state;

    // Expose article data and state
    return (
      <div className="camper-news">
        <Toolbar rootState={state} vars={props.toolbar}
          handleSortKey={this.handleSortKey}
          handleSearchField={this.handleSearchField}
          handleSearchInput={this.handleSearchInput}
        />
        <News rootState={state} handleClick={this.handleLoadMore} />
      </div>
    );
  }
});

// Should set amount of articles to represent.
let News = React.createClass({
  render() {
    let rootState = this.props.rootState;
    // Perform data manipulation
    let data, key, searchRe, searchField, partialData;

    data = rootState.data;
    searchRe = rootState.searchRe;
    searchField = searchRe && rootState.searchField;
    key  = rootState.sortKey;

    // Sort in desc order
    if (key)
      data.sort( (objA, objB) => objA[key] > objB[key] ? -1 : 1 );

    // Assume searchField is always set
    // I don't really like look of this code. Seems like its logic can be reduced.
    if (searchField === 'all')
      data = data.filter(article => {
        let text = article.headline.concat(article.metaDescription, article.author.username);
        return searchRe.test(text);
      });
    else if (searchField === 'author')
      data = data.filter( article => searchRe.test(article[searchField].username) );
    else if (searchField)
      data = data.filter( article => searchRe.test(article[searchField]) );

    // Control load amount
    partialData = data.slice(0, rootState.loadAmount);

    // Build articles
    let articles = partialData.map((data, i) => <Article data={data} key={i} />);

    return data.length > 0 ? (
      <div className="news">
        {articles}
        <LoadMore handleClick={this.props.handleClick} data={data} rootState={rootState} />
      </div>
    ) : <div className="news no-article-warning">No articles have been found<br />Press Search again to see all articles.</div>;
  }
});

let Article = React.createClass({
  render() {
    let data = this.props.data;

    return (
      <div className="article">
        <ArticleText data={data} />
      </div>
    );
  }
});

let ArticleImage = React.createClass({
  render() {
    let data = this.props.data;

    return data.image? (
      <div className="article-image">
        <img src={data.image} />
      </div>
    ) : null;
  }
});

let ArticleText = React.createClass({
  render() {
    // Let child component pick whatever data needed
    let data = this.props.data;

    return (
      <div className="article-text">
        <ArticleHeader data={data} />
        <ArticleAbstract data={data} />
        <ArticleMeta data={data} />
      </div>
    );
  }
});

let ArticleHeader = React.createClass({
  render() {
    let {link, headline, rank} = this.props.data;

    // Handle <a> display here
    return (
      <a className="article-header" href={link} target="_blank" style={ {display: "block"} }>
        <span className="article-headline">{headline.replace(/&amp;/g, '&')}</span>
        <i className="article-rank fa fa-heart-o">{rank}</i>
      </a>
    );
  }
});

let ArticleAbstract = React.createClass({
  render() {
    let abstract = this.props.data.metaDescription;

    return (
      <div className="article-abstract">
        {abstract ? abstract : 'No abstract has been provided.'}
      </div>
    );
  }
});

let ArticleMeta = React.createClass({
  render() {
    let {timePosted, author} = this.props.data;
    let date = (new Date(timePosted)).toString().replace(/\d{2}:.*/, '');

    return (
      <div className="article-meta">
        - posted by {author.username} on {date}
      </div>
    );
  }
})

/* LoadMore functionality
 *   Root owner has loadAmount state which determines amount of articles to load.
 *   Root owner takes loadLimit prop which determines amount of articles loaded on each time.
 *   This component always receive filtered data, loadAmount and a click handler that sets new loadAmount.
 *   By comparing data.length and loadAmount, it is possible to determine load avaiability.
 *
 *  This is a improvement over last version where it required three states to unreliably check load availability.
 */
let LoadMore = React.createClass({
  render() {
    let props = this.props;
    let hasArticle = props.data.length >= props.rootState.loadAmount;

    return (
      <div className="load-more" onClick={hasArticle ? props.handleClick : null} >
        {hasArticle ? "Load more articles \u226B" : <a href="#app">No more articles are left, back to the top?</a>}
      </div>
    );
  }
});

// Container for sortTab and searchTab
let Toolbar = React.createClass({
  render() {
    let vars = this.props.vars;
    let rootState = this.props.rootState;

    return (
      <div className="toolbar">
        <SortTab vars={vars.sortTab} rootState={rootState} handleSortKey={this.props.handleSortKey}/>
        <SearchTab vars={vars.searchTab} rootState={rootState} handleSearchField={this.props.handleSearchField} handleSearchInput={this.props.handleSearchInput} />
      </div>
    );
  }
});

/* Article sorting functionality
 *  Sort user interface is represented as radio buttons.
 *  Each radio buttons have value corresponding to raw data key.
 *  Upon sort request, root owner's 'sortKey' state is set.
 *  Then, sort will be performe on original full data.
 *  Sorting will be done with built-in array.sort(custom) by <Articles>.
 */
let SortTab = React.createClass({
  render() {
    let vars = this.props.vars;
    let rootState = this.props.rootState;

    // Build radio buttons
    let sortOptions = vars.sortOption.map((attr, i) => {
      return <SortOption vars={attr} rootState={rootState} key={i} />
    });

    return (
      <div className="sort-tab" onChange={this.props.handleSortKey}>
        <i className="fa fa-sort"></i>{sortOptions}
      </div>
    );
  }
});

let SortOption = React.createClass({
  render() {
    let rootState = this.props.rootState;
    let {id, value, name, label} = this.props.vars;

    // Controlling 'checked' manually to sync with initial rootOwner's state in straight forward way
    // This will raise warning 'provide handler when providing checked prop', it doesn't matter in this application,
    // but providing readOnly attribute just for sake of silencing warning.
    return (
      <span className="sort-option">
        <input type="radio" id={id} value={value} name={name} checked={rootState.sortKey === value} readOnly />
        <label htmlFor={id}>{label}</label>
      </span>
    );
  }
});

/* Search by keyword functionality
 *  User interface is presented with search field option, text input and submit button.
 *  Search field should present all(default), headline, abstract, meta.
 *  On submit
 *    if input exist, parse to regex and set searchRe.
 *    if input does not exist (including whitespace input), searchRe is set to null.
 *  If searchRe is set, data will be filtered at responsible component.
 *    If no article is present, inform it.
 *  If searchRe is not set, above process will simply be skipped, which result showing all articles.
 */
let SearchTab = React.createClass({
  render() {
    let vars = this.props.vars;
    let rootState = this.props.rootState;

    return (
      <div className="search-tab">
        <i className="fa fa-search"></i>
        <SearchField vars={vars.searchField} rootState={rootState}
         handleSearchField={this.props.handleSearchField} />
        <SearchInput handleSearchInput={this.props.handleSearchInput} />
      </div>
    );
  }
});

let SearchField = React.createClass({
  render() {
    let vars = this.props.vars;
    let rootState = this.props.rootState;

    let options = vars.searchOption.map((attr, i) => {
      return <SearchOption vars={attr} rootState={rootState} key={i} />
    });

    return (
      <select className="search-field" name={vars.name} value={rootState.searchField} onChange={this.props.handleSearchField}>
        {options}
      </select>
    );
  }
});

let SearchOption = React.createClass({
  render() {
    let {value, label} = this.props.vars;

    // React does not make use of 'selected' and rather warns you.
    // use defaultValue or value on select tag instead
    // 2016 1.23 Suddenly I needed to set text value of option tag to make option visible.
    //           This problem never happened when I finished building the app.
    return (
      <option label={label} value={value}>{label}</option>
    );
  }
});

// If react doesn't escpae incoming input, search for other library or implement myself.
let SearchInput = React.createClass({
  render() {
    return (
      <form className="search-input-form" onSubmit={this.props.handleSearchInput}>
        <input type="text" placeholder="Enter words to search." />
        <button className="search-btn">Search</button>
      </form>
    );
  }
});

ReactDOM.render(
  <CamperNews {...CONFIG} />,
  document.getElementById('app')
);
