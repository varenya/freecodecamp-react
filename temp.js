var WeatherBox = React.createClass({

  getWeatherInfo : function(){
    //var coords = this.getCurrentLocation();
      if (this.state.data.generalinfo != "Fetching.."){
            this.setBackgroundImage(this.state.data.generalinfo);
      }
      if (navigator.geolocation) {
          //console.log(this.props.url);
          var url = this.props.url;
          var that = this;
          navigator.geolocation.getCurrentPosition(function(position){
          var modurl = url + "?lon="+ position.coords.longitude + "&lat=" + position.coords.latitude+"&APPID=971c117af1fd90f89fc757f53fffb1a3";
          //console.log(modurl);
          $.ajax({
            url: modurl,
            dataType: 'json',
            cache: false,
            success: function(data) {
              var req_data = {};
              //console.log(data);
              req_data.temp = data.main.temp;
              req_data.location = data.name;
              req_data.generalinfo = data.weather[0].main;
              req_data.icon = data.weather[0].icon;
              //console.log(req_data);
              that.setState({data:req_data});
            }.bind(that),
            error: function(xhr, status, err) {
              var req_data ={temp:"Error in fetching",generalinfo:"Error in fetching",location:"Error in fetching"};
              this.setState({data:req_data});
              console.error(this.props.url, status, err.toString());
            }.bind(that)
          });
        });
      }
  },

  getInitialState: function () {

      var req_data = {};
      req_data.temp = "Fetching..";
      req_data.location = "Fetching..";
      req_data.generalinfo = "Fetching..";
      return {data:req_data};
  },

  setBackgroundImage: function (info) {
    //console.debug(info);
    var url_dict = {
      Clear:'http://www.torange.us/photo/20/16/Clear-sky-1363594685_18.jpg',
      Thunderstorm:'https://lh5.ggpht.com/nt58b5SnzhsDTRzNR2zgjibuEDkiMQmPbUAWer1QBgslUssmwdYI2fVjWf1Kw3fB-TMo=h900',
      Drizzle:"http://wallpoper.com/images/00/31/15/79/glass-raindrops_00311579.jpg",
      Rain:"http://applehdwallpaper.com/wp-content/uploads/Rain-Wallpaper-Android.jpg",
      Snow:"http://hdpicswall.com/wp-content/uploads/2015/12/Snow-Wallpaper.jpg",
      Atmosphere:"http://images4.alphacoders.com/515/51504.jpg",
      Clouds:"http://www.hdwallpapersnew.net/wp-content/uploads/2015/11/awesome-clouds-full-screen-high-definition-desktop-wallpaper-background-pictures.jpg",
      Extreme:"http://images.alphacoders.com/105/105701.jpg",
      Additional:"http://data.hdwallpapers.im/light_breeze_wds.jpg"
    };
    $("body").css('background-image','url('+url_dict[info]+')');
  },

  componentDidMount: function() {
    this.getWeatherInfo();
    setInterval(this.getWeatherInfo, this.props.pollInterval);
  },
  render: function () {
    return (
      <div className="row feature-wrapper">
        <Location location={this.state.data.location}/>
        <Temperature temp={this.state.data.temp}/>
        <GeneralInfo generalinfo={this.state.data.generalinfo} icon={this.state.data.icon}/>
      </div>
    );
  }

});

var Location = React.createClass({
  render: function () {
    return (
      <div className="col-md-4">
          <div className="icon">
            <h2 className="text-center weather-data">{this.props.location}</h2>
          </div>
      <h2 className="text-center"> Location </h2>
      </div>
    );
  }
});

var Temperature = React.createClass({
  toCelsius: function (kelvin) {
    return kelvin-273.15 + " C";

  },
  toFarenheit: function (kelvin) {
    return Math.floor(kelvin*9/5 - 459.67) + " F";
  },
  getInitialState: function () {
    return {celsius:true};
  },

  handleClick: function (event) {
    this.setState({celsius: !this.state.celsius});
  },
  render : function () {
    var temperature = this.state.celsius ? this.toCelsius(this.props.temp) : this.toFarenheit(this.props.temp);
    return (
      <div className="col-md-4">
        <div className="icon" onClick={this.handleClick}>
          <h2 className="text-center weather-data">{typeof(this.props.temp) == "string" ? "Fetching.." : temperature}  </h2>
        </div>
      <h2 className="text-center"> Temperature </h2>
      </div>
    );
  }
});

var GeneralInfo = React.createClass({
  render : function () {
    var imgurl = "http://openweathermap.org/img/w/"+this.props.icon+".png";
    //console.log(imgurl);
    return (
      <div className="col-md-4">
        <div className="icon">
          <h2 className="text-center weather-data"><img src={imgurl}/><span className="weather-generalinfo">{this.props.generalinfo}</span></h2>
        </div>
      <h2 className="text-center"> Weather </h2>
      </div>
    );
  }
});


var WeatherRoot = React.createClass({
  render: function() {
    return (
    <div className="container">
      <WeatherBox url="http://api.openweathermap.org/data/2.5/weather" pollInterval={2000}/>
    </div>
  );
}
});

ReactDOM.render(<WeatherRoot />,document.getElementById('content') );
