"use strict";

var VoteButton = React.createClass({
	cancelVote(e) {
		socket.emit("gather:vote", {
			leader: {
				candidate: null
			}
		});
	},

	vote(e) {
		e.preventDefault();
		socket.emit("gather:vote", {
			leader: {
				candidate: parseInt(e.target.value, 10)
			}
		});
	},

	render() {
		if (this.props.currentGatherer === null) {
			return false;
		}
		if (this.props.currentGatherer.leaderVote === this.props.candidate.id) {
			return (
				<button 
					onClick={this.cancelVote} 
					className="btn btn-xs btn-success">Voted
				</button>
			);
		} else {
			return (
				<button 
					onClick={this.vote} 
					className="btn btn-xs btn-default"
					value={this.props.candidate.id}>Vote
				</button>
			);
		}
	}
});

var SelectPlayerButton = React.createClass({
	selectPlayer(e) {
		e.preventDefault();
		socket.emit("gather:select", {
			player: parseInt(e.target.value, 10)
		})
	},

	render() {
		if (this.props.gatherer.leader) {
			return (<button 
				className="btn btn-xs btn-default"
				data-disabled="true">Leader</button>);
		} else if (this.props.gatherer.team !== "lobby") {
			return (<button
				onClick={this.selectPlayer}
				value={this.props.gatherer.id}
				className="btn btn-xs btn-default"> Reselect
				</button>
			);
		} else {
			return (<button
				onClick={this.selectPlayer}
				value={this.props.gatherer.id}
				className="btn btn-xs btn-primary"> Select
				</button>
			);
		}
	}
});

var GathererList = React.createClass({
	memberList() {
		var self = this;
		return this.props.gather.gatherers
			.filter(gatherer => gatherer.team === self.props.team )
			.sort(gatherer => gatherer.leader ? 1 : -1);
	},

	render() {
		var extractGatherer = gatherer => {
			var image;
			if (gatherer.leader) {
				image = (<img src="/images/commander.png" 
					alt="Commander" 
					height="20"
					width="20" />);
			}
			return (
				<tr key={gatherer.id}>
					<td className="col-md-1">{image}</td>
					<td className="col-md-11">{gatherer.user.username}</td>
				</tr>
			);
		}
		var members = this.memberList().map(extractGatherer);
		return (
			<table className="table">
				<tbody>
					{members}
				</tbody>
			</table>
		);
	}
});

var GatherTeams = React.createClass({
	render() {
		return (
			<div className="panel-body">
				<div className="row">
					<div className="col-md-6">
						<div className="panel panel-default">
							<div className="panel-heading">
								Aliens
							</div>
							<GathererList gather={this.props.gather} team="alien" />
						</div>
					</div>
					<div className="col-md-6">
						<div className="panel panel-default">
							<div className="panel-heading">
								Marines
							</div>
							<GathererList gather={this.props.gather} team="marine" />
						</div>
					</div>
				</div>
			</div>
		);
	}
});

var ElectionProgressBar = React.createClass({
	componentDidMount() {
		var self = this;
		this.timer = setInterval(() => {
			self.forceUpdate();
		}, 900);
	},

	progress() {
		var interval = this.props.gather.election.interval;
		var startTime = (new Date(this.props.gather.election.startTime)).getTime();
		var msTranspired = Math.floor((new Date()).getTime() - startTime);

		return {
			num: msTranspired,
			den: interval,
			barMessage: Math.floor((interval - msTranspired) / 1000) + "s remaining"
		}
	},

	componentWillUnmount() {
		clearInterval(this.timer);
	},

	render() {
		return (<ProgressBar progress={this.progress()} />);
	}
});

var ProgressBar = React.createClass({
	render() {
		var style = {
			width: Math.round((this.props.progress.num / this.props.progress.den * 100)) + "%"
		};
		var barMessage = this.props.progress.barMessage || "";
		return (
			<div className="progress">
			  <div className="progress-bar progress-bar-striped active" 
			  	data-role="progressbar" 
			  	data-aria-valuenow={this.props.progress.num} 
			  	data-aria-valuemin="0" 
			  	data-aria-valuemax={this.props.progress.den} 
			  	style={style}>{barMessage}
			  </div>
		  </div>
		);
	}
});

var GatherProgress = React.createClass({
	stateDescription() {
		switch(this.props.gather.state) {
			case "gathering":
				return "Waiting for more gatherers.";
			case "election":
				return "Currently voting for team leaders.";
			case "selection":
				return "Waiting for leaders to pick teams.";
			case "done":
				return "Gather completed.";
			default:
				return "Initialising gather.";
		}
	},

	gatheringProgress() {
		var num = this.props.gather.gatherers.length;
		var den = 12;
		var remaining = den - num;
		var message = (remaining === 1) ? "Waiting for last player" : "Waiting for " + remaining + " more players";
		return {
			num: num,
			den: den,
			message: message
		};
	},

	electionProgress() {
		var num = this.props.gather.gatherers.reduce((acc, gatherer) => {
			if (gatherer.leaderVote) acc++;
			return acc;
		}, 0);
		var den = 12;
		return {
			num: num,
			den: den,
			message: den - num + " more votes required"
		};
	},

	selectionProgress() {
		var num = this.props.gather.gatherers.reduce((acc, gatherer) => {
			if (gatherer.team !== "lobby") acc++;
			return acc;
		}, 0);
		var den = 12;

		return {
			num: num,
			den: den,
			message: num + " out of " + den + " players assigned"
		};
	},

	render() {
		var progress, progressBar;
		var gatherState = this.props.gather.state;
		if (gatherState === 'gathering' && this.props.gather.gatherers.length) {
			progress = this.gatheringProgress();
			progressBar = (<ProgressBar progress={progress} />);
		} else if (gatherState === 'election') {
			progress = this.electionProgress();
			progressBar = (<ElectionProgressBar {...this.props} progress={progress} />);
		} else if (gatherState === 'selection') {
			progress = this.selectionProgress();
			progressBar = (<ProgressBar progress={progress} />);
		}

		if (!progress) return false;

		return (
			<div className="panel-body no-bottom">
				<p><strong>{this.stateDescription()}</strong> {progress.message}</p>
				{progressBar}
			</div>
		);
	}
});

var GatherActions = React.createClass({
	joinGather(e) {
		e.preventDefault();
		socket.emit("gather:join");
	},

	leaveGather(e) {
		e.preventDefault();
		socket.emit("gather:leave");
	},

	confirmTeam(e) {
		e.preventDefault();
		socket.emit("gather:select:confirm");
	},

	inviteToGather(e) {
		e.preventDefault();
		alert("Boop!");
	},

	render() {
		var joinButton;
		if (this.props.currentGatherer) {
			joinButton = (<li><button 
							onClick={this.leaveGather} 
							className="btn btn-danger">Leave Gather</button></li>);
		} else if (this.props.gather.state === 'gathering') {
			joinButton = (
				<button 
					onClick={this.joinGather} 
					className="btn btn-success">Join Gather</button>
			);
		}

		var confirmTeam;
		if (this.props.currentGatherer &&
				this.props.currentGatherer.leader &&
				this.props.gather.state === 'selection' &&
				this.props.gather.gatherers.every(gatherer => gatherer.team !== 'lobby')) {
			if (this.props.currentGatherer.confirm) {
				confirmTeam = (
					<li>
						<button
							className="btn btn-default"
							data-disabled="true"
							>
							Confirmed
						</button>
					</li>
				);
			} else {
				confirmTeam = (
					<li>
					<button
						className="btn btn-success"
						onClick={this.confirmTeam}
						>
						Confirm Team
					</button>
					</li>
				);
			}
		}

		var inviteButton;
		if (this.props.gather.state === 'gathering') {
			inviteButton = (<li><button
							onClick={this.inviteToGather}
							className="btn btn-primary">Invite to Gather</button></li>);
		}

		return (
			<div className="panel-footer text-right">
				<ul className="list-inline no-bottom">
					{confirmTeam}
					{inviteButton}
					{joinButton}
				</ul>
			</div>
		);
	}
});

var ServerVoting = React.createClass({
	handleServerVote(e) {
		e.preventDefault();
		socket.emit("gather:vote", {
			server: {
				id: parseInt(e.target.value, 10)
			}
		});
	},

	votesForServer(server) {
		return this.props.gather.gatherers.reduce((acc, gatherer) => {
			if (server.id === gatherer.serverVote) acc++;
			return acc;
		}, 0);
	},

	render() {
		var self = this;
		var servers = self.props.servers.map(server => {
			var voteButton;
			if (self.props.currentGatherer.serverVote === server.id) {
				voteButton = (<button
											data-disabled="true"
											className="btn btn-xs btn-success">
											Voted</button>)
			} else {
				voteButton = (<button
											onClick={self.handleServerVote}
											value={server.id}
											className="btn btn-xs btn-primary">
											Vote</button>);
			}
			return (
				<tr key={server.id}>
					<td className="col-md-6">{server.description || server.dns}</td>
					<td className="col-md-6 text-right">
						{self.votesForServer(server)} Votes&nbsp;
						{voteButton}
					</td>
				</tr>
			);
		});
		return (
			<div className="panel panel-default">
				<div className="panel-heading">
					Server Voting
				</div>
				<table id="serverVoteTable" className="table table-condensed table-hover voting-table">
					{servers}
				</table>
			</div>
		);
	}
})

var MapVoting = React.createClass({
	handleMapVote(e) {
		e.preventDefault();
		socket.emit("gather:vote", {
			map: {
				id: parseInt(e.target.value, 10)
			}
		});
	},

	votesForMap(map) {
		return this.props.gather.gatherers.reduce((acc, gatherer) => {
			if (map.id === gatherer.mapVote) acc++;
			return acc;
		}, 0);
	},

	render() {
		var self = this;
		var maps = self.props.maps.map(map => {
			var voteButton;
			if (self.props.currentGatherer.mapVote === map.id) {
				voteButton = (<button
											data-disabled="true"
											className="btn btn-xs btn-success">
											Voted</button>)
			} else {
				voteButton = (<button
											onClick={self.handleMapVote}
											value={map.id}
											className="btn btn-xs btn-primary">
											Vote</button>);
			}
			return (
				<tr key={map.id}>
					<td className="col-md-6">{map.name}</td>
					<td className="col-md-6 text-right">
						{self.votesForMap(map)} Votes&nbsp;
						{voteButton}
					</td>
				</tr>
			);
		});
		return (
			<div className="panel panel-default">
				<div className="panel-heading">
					Map Voting
				</div>
				<table className="table table-condensed table-hover voting-table">
					{maps}
				</table>
			</div>
		);
	}
})

var Gather = React.createClass({
	getDefaultProps() {
		return {
			gather: {
				gatherers: []
			}
		}
	},

	componentDidMount() {
		var self = this;
		socket.on("gather:refresh", data => self.setProps(data));
	},
	
	render() {
		if (this.props.gather.state === 'done') {
			return (<CompletedGather {...this.props} />);
		}

		var voting;
		if (this.props.currentGatherer) {
			voting = (
				<div className="panel-body">
					<div className="row">
						<div className="col-md-6">
							<MapVoting {...this.props} />
						</div>
						<div className="col-md-6">
							<ServerVoting {...this.props} />
						</div>
					</div>
				</div>
			);
		}

		var gatherTeams;
		if (this.props.gather.state === 'selection') {
			gatherTeams = <GatherTeams gather={this.props.gather} />
		}

		var previousGather;
		if (this.props.previousGather) {
			previousGather = (<CompletedGather {...this.props} gather={this.props.previousGather} />);
		}
		return (
			<div>
			<div className="panel panel-default">
				<div className="panel-heading">
					<strong>Current Gather</strong>
					<span className="badge add-left">{this.props.gather.gatherers.length}</span>
				</div>
				<GatherProgress {...this.props} />
				<Gatherers {...this.props} />
				{gatherTeams}
				{voting}
				<GatherActions {...this.props} />
			</div>			
			{previousGather}
		</div>
		);
	}
});

var Gatherers = React.createClass({
	joinGather(e) {
		e.preventDefault();
		socket.emit("gather:join");
	},

	render() {
		var self = this;
		var gatherers = this.props.gather.gatherers.map(gatherer => {
			
			// Country
			var country;

			if (gatherer.user.country) {
				country = (<img src="images/blank.gif" 
												className={"flag flag-" + gatherer.user.country.toLowerCase()} 
												alt={gatherer.user.country} />);
			};

			var division = (<span className="label label-primary">{gatherer.user.ability.division}</span>);
			var lifeform = (
				gatherer.user.ability.lifeforms.map(lifeform => {
					return (<span className="label label-default" 
												key={[lifeform, gatherer.id].join("-")}>{lifeform}</span>);
				})
			);
			var team; 

			if (gatherer.user.team) {
				team = (<span className="label label-primary">{gatherer.user.team.name}</span>);
			}

			var action;

			if (self.props.gather.state === "election") {
				var votes = self.props.gather.gatherers.reduce((acc, voter) => {
					if (voter.leaderVote === gatherer.id) acc++;
					return acc;
				}, 0)
				action = (
					<span>
						<small>{votes + " votes"} &nbsp;</small>
						<VoteButton currentGatherer={self.props.currentGatherer} candidate={gatherer} />
					</span>
				);
			}

			if (self.props.gather.state === 'selection') {
				if (self.props.currentGatherer && self.props.currentGatherer.leader) {
					action = (
						<span>
							<SelectPlayerButton gatherer={gatherer} />
						</span>
					);
				} else {
					if (gatherer.team !== "lobby") {
						action = (<span className="label label-success">{gatherer.team}</span>);
					}
				}
			}

			return (
				<tr key={gatherer.user.id} data-userid={gatherer.user.id}>
					<td className="col-md-5">{country} {gatherer.user.username}&nbsp;</td>
					<td className="col-md-5">
						{lifeform} {division} {team}&nbsp;
					</td>
					<td className="col-md-2 text-right">{action}&nbsp;</td>
				</tr>
			);
		})
		if (this.props.gather.gatherers.length) {
			return (
				<div className="panel-body">
					<div className="panel panel-default">
						<table className="table roster-table">
							<tbody>
								{gatherers}
							</tbody>
						</table>
					</div>
				</div>
			);
		} else {
			return (
				<div className="panel-body text-center join-hero">
					<button 
						onClick={this.joinGather} 
						className="btn btn-success btn-lg">Start a Gather</button>
				</div>
			);
		}
	}
});

var CompletedGather = React.createClass({
	countVotes(voteType) {
		return this.props.gather.gatherers.reduce((acc, gatherer) => {
			if (gatherer[voteType] !== null) acc.push(gatherer[voteType]);
			return acc;
		}, []);
	},

	selectedMaps() {
		return rankVotes(this.countVotes('mapVote'), this.props.maps).slice(0, 2)
	},

	selectedServer() {
		return rankVotes(this.countVotes('serverVote'), this.props.servers).slice(0, 1);
	},

	render() {
		var maps = this.selectedMaps();
		var server = this.selectedServer().pop();
		return (
			<div className="panel panel-default">
				<div className="panel-heading">
					<strong>Previous Gather</strong>
				</div>
				<GatherTeams gather={this.props.gather} />
				<div className="panel-body">
					<dl className="dl-horizontal">
					  <dt>Maps</dt>
					  <dd>{maps.map(map => map.name).join(" & ")}</dd>
					  <dt>Server</dt>
					  <dd>{server.name}</dd>
					  <dt>Address</dt>
					 	<dd>{server.ip}:{server.port}</dd>
					 	<dt>Password</dt>
					  <dd>{server.password}</dd>
					  <br />
					  <dt>&nbsp;</dt>
						<dd><a href={["steam://run/4920/connect", server.ip +":"+server.port, server.password].join("/")}
								className="btn btn-primary">Click to Join</a></dd>
					</dl>
				</div>
			</div>
		);
	}
});
